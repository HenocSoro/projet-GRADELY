"""
Views pour l'API des projets et tâches.

Structure :
- ProjectViewSet : CRUD projets avec permissions par rôle
- TaskViewSet : CRUD tâches (accès via projet owner/supervisor)
- student_dashboard : endpoint agrégé pour le tableau de bord étudiant
"""

from datetime import date, timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project, Task
from .permissions import IsProjectMember, IsProjectOwnerOrSupervisor
from .serializers import ProjectSerializer, TaskSerializer

# Constantes pour le dashboard (évite les typos)
PROJECT_ACTIVE = "active"
TASK_TODO = "todo"
TASK_IN_PROGRESS = "in_progress"
TASK_DONE = "done"
TASK_BLOCKED = "blocked"


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les projets.

    Queryset : projets où l'utilisateur est owner OU supervisor.
    Création : owner = request.user automatiquement.
    """

    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectOwnerOrSupervisor]

    def get_queryset(self):
        """Retourne les projets accessibles : ceux dont l'user est owner ou supervisor."""
        user = self.request.user
        return (
            Project.objects.filter(Q(owner=user) | Q(supervisor=user))
            .select_related("owner", "supervisor")
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        """À la création, owner est forcé à request.user."""
        serializer.save(owner=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les tâches.

    Queryset : tâches des projets où l'utilisateur est owner ou supervisor.
    Création : vérification que le projet appartient à l'user (owner ou supervisor).
    """

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        """Retourne les tâches des projets accessibles à l'utilisateur."""
        user = self.request.user
        return (
            Task.objects.filter(
                Q(project__owner=user) | Q(project__supervisor=user)
            )
            .select_related("project")
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        """Vérifie que l'utilisateur a accès au projet avant d'ajouter la tâche."""
        project = serializer.validated_data["project"]
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Tu ne peux pas ajouter une tâche à ce projet.")
        serializer.save()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    """
    Tableau de bord étudiant : résumé des projets, tâches et nudges.

    Retourne uniquement les projets dont l'utilisateur est owner
    (les superviseurs ont leur propre vue, non implémentée ici).
    """
    user = request.user
    today = date.today()

    # Projets dont l'utilisateur est propriétaire
    projects = Project.objects.filter(owner=user).order_by("-updated_at")
    tasks = Task.objects.filter(project__owner=user)

    total_tasks = tasks.count()
    overdue_tasks = tasks.filter(due_date__lt=today).exclude(status=TASK_DONE).count()
    blocked_tasks = tasks.filter(status=TASK_BLOCKED).count()

    # Nudges : suggestions d'action pour l'étudiant
    nudges = []

    # Nudge 1 : tâches bloquées depuis >= 5 jours
    five_days_ago = timezone.now() - timedelta(days=5)
    blocked_old = tasks.filter(
        status=TASK_BLOCKED,
        blocked_since__isnull=False,
        blocked_since__lte=five_days_ago,
    ).count()
    if blocked_old > 0:
        nudges.append(
            {
                "type": "blocked_stale",
                "title": "Tâches bloquées trop longtemps",
                "message": f"{blocked_old} tâche(s) bloquée(s) depuis 5+ jours.",
                "severity": "warning",
            }
        )

    # Nudge 2 : tâches en retard
    if overdue_tasks > 0:
        nudges.append(
            {
                "type": "overdue",
                "title": "Tâches en retard",
                "message": f"{overdue_tasks} tâche(s) en retard.",
                "severity": "danger",
            }
        )

    # Nudge 3 : trop de tâches en parallèle
    in_progress_count = tasks.filter(status=TASK_IN_PROGRESS).count()
    if in_progress_count >= 4:
        nudges.append(
            {
                "type": "too_many_in_progress",
                "title": "Trop de tâches en parallèle",
                "message": f"{in_progress_count} tâches en cours.",
                "severity": "warning",
            }
        )

    # Nudge 4 : priorités élevées non commencées
    high_priority_todo = tasks.filter(status=TASK_TODO, priority__lte=2).count()
    if high_priority_todo > 0:
        nudges.append(
            {
                "type": "high_priority_todo",
                "title": "Priorités élevées non commencées",
                "message": f"{high_priority_todo} tâche(s) prioritaire(s) non commencée(s).",
                "severity": "danger",
            }
        )

    # Nudge 5 : risque de retard (deadline proche + progression faible)
    urgent_projects = []
    for p in projects:
        if p.end_date:
            days_left = (p.end_date - today).days
            if 0 <= days_left <= 10 and p.progress_percent < 60:
                urgent_projects.append((p.id, p.title, days_left, p.progress_percent))
    if urgent_projects:
        urgent_projects = urgent_projects[:3]
        msg_parts = [f"{t} ({d} j, {pr}%)" for (_, t, d, pr) in urgent_projects]
        nudges.append(
            {
                "type": "deadline_risk",
                "title": "Risque de retard sur échéance",
                "message": "Projets à risque: " + " | ".join(msg_parts),
                "severity": "danger",
            }
        )

    return Response(
        {
            "summary": {
                "total_projects": projects.count(),
                "active_projects": projects.filter(status=PROJECT_ACTIVE).count(),
                "total_tasks": total_tasks,
                "overdue_tasks": overdue_tasks,
                "blocked_tasks": blocked_tasks,
                "in_progress_tasks": in_progress_count,
                "high_priority_todo": high_priority_todo,
            },
            "projects": [
                {
                    "id": p.id,
                    "title": p.title,
                    "status": p.status,
                    "start_date": p.start_date,
                    "end_date": p.end_date,
                    "progress": p.progress_percent,
                    "tasks_total": p.tasks.count(),
                    "tasks_done": p.tasks.filter(status=TASK_DONE).count(),
                    "tasks_overdue": p.tasks.filter(due_date__lt=today)
                    .exclude(status=TASK_DONE)
                    .count(),
                    "tasks_blocked": p.tasks.filter(status=TASK_BLOCKED).count(),
                    "last_activity_at": p.updated_at,
                }
                for p in projects
            ],
            "nudges": nudges,
        }
    )
