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
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ActivityLog,
    Comment,
    Deliverable,
    Milestone,
    Project,
    Review,
    Sprint,
    Submission,
    SupervisionRequest,
    Task,
)
from .services import log_activity
from .permissions import (
    IsProjectMember,
    IsProjectOwnerOrSupervisor,
    IsSupervisorForReview,
)
from .serializers import (
    ActivityLogSerializer,
    CommentSerializer,
    DeliverableSerializer,
    MilestoneSerializer,
    ProjectSerializer,
    ReviewSerializer,
    SprintSerializer,
    SubmissionDetailSerializer,
    SubmissionSerializer,
    SupervisionRequestSerializer,
    TaskSerializer,
)

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
        project = serializer.save(owner=self.request.user)
        log_activity(
            project,
            self.request.user,
            ActivityLog.ActionType.PROJECT_CREATED,
            f"Projet « {project.title} » créé",
        )

    def perform_update(self, serializer):
        project = serializer.save()
        log_activity(
            project,
            self.request.user,
            ActivityLog.ActionType.PROJECT_UPDATED,
            f"Projet « {project.title} » modifié",
        )


class ProjectActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Journal d'activité d'un projet (lecture seule).
    GET /api/projects/<project_pk>/activity/
    """

    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_pk = self.kwargs.get("project_pk")
        project = Project.objects.filter(pk=project_pk).first()
        if not project:
            return ActivityLog.objects.none()
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            return ActivityLog.objects.none()
        return ActivityLog.objects.filter(project=project).select_related("actor")


class ProjectCommentViewSet(viewsets.ModelViewSet):
    """
    Commentaires d'un projet.
    GET, POST /api/projects/<project_pk>/comments/
    """

    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        project_pk = self.kwargs.get("project_pk")
        project = Project.objects.filter(pk=project_pk).first()
        if not project:
            return Comment.objects.none()
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            return Comment.objects.none()
        return Comment.objects.filter(project=project).select_related("author")

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs["project_pk"])
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Accès refusé à ce projet.")
        serializer.save(project=project, author=user)
        log_activity(
            project,
            user,
            ActivityLog.ActionType.COMMENT_ADDED,
            f"{user.email} a ajouté un commentaire",
        )


class ProjectMilestoneViewSet(viewsets.ModelViewSet):
    """
    Jalons d'un projet.
    GET, POST, PUT, PATCH, DELETE /api/projects/<project_pk>/milestones/
    """

    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_pk = self.kwargs.get("project_pk")
        project = Project.objects.filter(pk=project_pk).first()
        if not project:
            return Milestone.objects.none()
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            return Milestone.objects.none()
        return Milestone.objects.filter(project=project)

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs["project_pk"])
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Accès refusé à ce projet.")
        milestone = serializer.save(project=project)
        log_activity(
            project,
            user,
            ActivityLog.ActionType.MILESTONE_CREATED,
            f"Jalon « {milestone.title} » créé",
            {"milestone_id": milestone.id},
        )

    def perform_update(self, serializer):
        milestone = serializer.save()
        log_activity(
            milestone.project,
            self.request.user,
            ActivityLog.ActionType.MILESTONE_UPDATED,
            f"Jalon « {milestone.title} » modifié",
            {"milestone_id": milestone.id},
        )


class ProjectSprintViewSet(viewsets.ModelViewSet):
    """
    Sprints d'un projet.
    GET, POST, PUT, PATCH, DELETE /api/projects/<project_pk>/sprints/
    """

    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_pk = self.kwargs.get("project_pk")
        project = Project.objects.filter(pk=project_pk).first()
        if not project:
            return Sprint.objects.none()
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            return Sprint.objects.none()
        return Sprint.objects.filter(project=project)

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs["project_pk"])
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Accès refusé à ce projet.")
        sprint = serializer.save(project=project)
        log_activity(
            project,
            user,
            ActivityLog.ActionType.SPRINT_CREATED,
            f"Sprint « {sprint.title} » créé",
            {"sprint_id": sprint.id},
        )

    def perform_update(self, serializer):
        sprint = serializer.save()
        log_activity(
            sprint.project,
            self.request.user,
            ActivityLog.ActionType.SPRINT_UPDATED,
            f"Sprint « {sprint.title} » modifié",
            {"sprint_id": sprint.id},
        )


class ProjectDeliverableViewSet(viewsets.ModelViewSet):
    """
    Livrables d'un projet.
    GET, POST, PUT, PATCH, DELETE /api/projects/<project_pk>/deliverables/
    """

    serializer_class = DeliverableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_pk = self.kwargs.get("project_pk")
        project = Project.objects.filter(pk=project_pk).first()
        if not project:
            return Deliverable.objects.none()
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            return Deliverable.objects.none()
        return Deliverable.objects.filter(project=project)

    def perform_create(self, serializer):
        project = Project.objects.get(pk=self.kwargs["project_pk"])
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Accès refusé à ce projet.")
        deliverable = serializer.save(project=project)
        log_activity(
            project,
            user,
            ActivityLog.ActionType.DELIVERABLE_CREATED,
            f"Livrable « {deliverable.title} » créé",
            {"deliverable_id": deliverable.id},
        )


class DeliverableSubmissionViewSet(viewsets.ModelViewSet):
    """
    Dépôts d'un livrable.
    GET, POST /api/projects/.../deliverables/<deliverable_pk>/submissions/
    Owner peut créer, owner et supervisor peuvent lire.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "head", "options", "patch", "put", "delete"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return SubmissionDetailSerializer
        return SubmissionSerializer

    def get_queryset(self):
        deliverable_pk = self.kwargs.get("deliverable_pk")
        deliverable = Deliverable.objects.filter(pk=deliverable_pk).select_related("project").first()
        if not deliverable:
            return Submission.objects.none()
        project = deliverable.project
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            return Submission.objects.none()
        return Submission.objects.filter(deliverable=deliverable).select_related(
            "submitted_by"
        ).prefetch_related("review")

    def perform_create(self, serializer):
        deliverable = Deliverable.objects.select_related("project").get(
            pk=self.kwargs["deliverable_pk"]
        )
        project = deliverable.project
        user = self.request.user
        if project.owner_id != user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Seul l'owner peut soumettre un livrable.")
        submission = serializer.save(deliverable=deliverable, submitted_by=user)
        if submission.status == Submission.Status.SUBMITTED:
            submission.submitted_at = timezone.now()
            submission.save(update_fields=["submitted_at"])
        log_activity(
            project,
            user,
            ActivityLog.ActionType.SUBMISSION_CREATED,
            f"Dépôt pour « {deliverable.title} »",
            {"submission_id": submission.id},
        )

    def perform_update(self, serializer):
        submission = serializer.save()
        if submission.status == Submission.Status.SUBMITTED and not submission.submitted_at:
            submission.submitted_at = timezone.now()
            submission.save(update_fields=["submitted_at"])


class SubmissionReviewView(APIView):
    """
    POST /api/submissions/<submission_pk>/review/
    Créer ou mettre à jour la revue. Uniquement le superviseur.
    """

    permission_classes = [IsAuthenticated, IsSupervisorForReview]

    def get_submission(self, pk):
        submission = Submission.objects.select_related(
            "deliverable__project"
        ).filter(pk=pk).first()
        if not submission:
            from rest_framework.exceptions import NotFound

            raise NotFound("Dépôt introuvable.")
        return submission

    def get(self, request, submission_pk):
        submission = self.get_submission(submission_pk)
        project = submission.deliverable.project
        if project.owner_id != request.user.id and project.supervisor_id != request.user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Accès refusé.")
        if hasattr(submission, "review"):
            serializer = ReviewSerializer(submission.review)
            return Response(serializer.data)
        return Response({}, status=404)

    def post(self, request, submission_pk):
        from rest_framework.exceptions import PermissionDenied

        submission = self.get_submission(submission_pk)
        self.check_object_permissions(request, submission)
        project = submission.deliverable.project
        if project.supervisor_id != request.user.id:
            raise PermissionDenied("Seul le superviseur peut valider.")
        serializer = ReviewSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        review, created = Review.objects.update_or_create(
            submission=submission,
            defaults={
                "reviewer": request.user,
                "status": serializer.validated_data.get("status", Review.Status.PENDING),
                "feedback": serializer.validated_data.get("feedback", ""),
            },
        )
        log_activity(
            project,
            request.user,
            ActivityLog.ActionType.REVIEW_SUBMITTED,
            f"Revue envoyée pour « {submission.deliverable.title} » : {review.get_status_display()}",
            {"submission_id": submission.id, "review_id": review.id},
        )
        return Response(ReviewSerializer(review).data)


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
            .select_related("project", "sprint")
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        """Vérifie que l'utilisateur a accès au projet avant d'ajouter la tâche."""
        project = serializer.validated_data["project"]
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Tu ne peux pas ajouter une tâche à ce projet.")
        task = serializer.save()
        log_activity(
            project,
            user,
            ActivityLog.ActionType.TASK_CREATED,
            f"Tâche « {task.title} » créée",
            {"task_id": task.id},
        )

    def perform_update(self, serializer):
        task = serializer.save()
        log_activity(
            task.project,
            self.request.user,
            ActivityLog.ActionType.TASK_UPDATED,
            f"Tâche « {task.title} » modifiée",
            {"task_id": task.id},
        )


class SupervisionRequestViewSet(viewsets.GenericViewSet):
    """
    Demandes de supervision.
    GET /api/supervision-requests/ : liste des demandes (envoyées par moi ou reçues par moi).
    PATCH /api/supervision-requests/<id>/ : accepter ou refuser (uniquement le prof destinataire).
    """

    serializer_class = SupervisionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            SupervisionRequest.objects.filter(
                Q(project__owner=user) | Q(requested_supervisor=user)
            )
            .select_related("project", "project__owner", "requested_supervisor")
            .order_by("-created_at")
        )

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        req = self.get_queryset().filter(pk=pk).first()
        if not req:
            from rest_framework.exceptions import NotFound
            raise NotFound("Demande introuvable.")
        serializer = self.get_serializer(req)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        from rest_framework.exceptions import PermissionDenied, ValidationError

        req = self.get_queryset().filter(pk=pk).first()
        if not req:
            from rest_framework.exceptions import NotFound
            raise NotFound("Demande introuvable.")
        if req.requested_supervisor_id != request.user.id:
            raise PermissionDenied("Seul le superviseur sollicité peut répondre.")
        if req.status != SupervisionRequest.Status.PENDING:
            raise ValidationError({"status": "Cette demande a déjà été traitée."})

        status = request.data.get("status")
        response_message = request.data.get("response_message", "").strip() or ""
        if status not in (SupervisionRequest.Status.ACCEPTED, SupervisionRequest.Status.DECLINED):
            raise ValidationError({"status": "Choisir accepted ou declined."})

        req.status = status
        req.response_message = response_message
        req.responded_at = timezone.now()
        req.save()

        if status == SupervisionRequest.Status.ACCEPTED:
            project = req.project
            project.supervisor_id = req.requested_supervisor_id
            project.save(update_fields=["supervisor_id", "updated_at"])
            log_activity(
                project,
                request.user,
                ActivityLog.ActionType.SUPERVISION_REQUEST_ACCEPTED,
                f"Demande de supervision acceptée par {request.user.email}",
                {"supervision_request_id": req.id},
            )
        else:
            log_activity(
                req.project,
                request.user,
                ActivityLog.ActionType.SUPERVISION_REQUEST_DECLINED,
                f"Demande de supervision refusée par {request.user.email}",
                {"supervision_request_id": req.id},
            )

        serializer = self.get_serializer(req)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="pending-count")
    def pending_count(self, request):
        """Nombre de demandes reçues par le superviseur et en attente."""
        count = SupervisionRequest.objects.filter(
            requested_supervisor=request.user,
            status=SupervisionRequest.Status.PENDING,
        ).count()
        return Response({"count": count})


class ProjectSupervisionRequestViewSet(viewsets.GenericViewSet):
    """
    Demandes de supervision pour un projet.
    GET /api/projects/<project_pk>/supervision-requests/ : liste des demandes du projet.
    POST /api/projects/<project_pk>/supervision-requests/ : envoyer une demande (owner only).
    """

    serializer_class = SupervisionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_pk = self.kwargs.get("project_pk")
        project = Project.objects.filter(pk=project_pk).first()
        if not project:
            return SupervisionRequest.objects.none()
        user = self.request.user
        if project.owner_id != user.id and project.supervisor_id != user.id:
            return SupervisionRequest.objects.none()
        return (
            SupervisionRequest.objects.filter(project_id=project_pk)
            .select_related("project", "requested_supervisor")
            .order_by("-created_at")
        )

    def list(self, request, project_pk=None):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, project_pk=None):
        from rest_framework.exceptions import PermissionDenied, ValidationError

        project = Project.objects.filter(pk=project_pk).first()
        if not project:
            from rest_framework.exceptions import NotFound
            raise NotFound("Projet introuvable.")
        if project.owner_id != request.user.id:
            raise PermissionDenied("Seul le propriétaire du projet peut demander une supervision.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        requested_supervisor_id = serializer.validated_data.get("requested_supervisor").id
        message = serializer.validated_data.get("message", "") or ""

        from django.contrib.auth import get_user_model
        User = get_user_model()
        supervisor_user = User.objects.filter(pk=requested_supervisor_id).first()
        if not supervisor_user or not (supervisor_user.is_staff or supervisor_user.is_superuser):
            raise ValidationError(
                {"requested_supervisor": "Le destinataire doit être un enseignant (staff)."}
            )
        if project.owner_id == requested_supervisor_id:
            raise ValidationError(
                {"requested_supervisor": "Vous ne pouvez pas vous assigner vous-même."}
            )

        existing = SupervisionRequest.objects.filter(
            project=project,
            requested_supervisor_id=requested_supervisor_id,
            status=SupervisionRequest.Status.PENDING,
        ).exists()
        if existing:
            raise ValidationError(
                {"requested_supervisor": "Une demande en attente existe déjà pour ce superviseur."}
            )

        req = SupervisionRequest.objects.create(
            project=project,
            requested_supervisor_id=requested_supervisor_id,
            message=message,
            status=SupervisionRequest.Status.PENDING,
        )
        log_activity(
            project,
            request.user,
            ActivityLog.ActionType.SUPERVISION_REQUEST_SENT,
            f"Demande de supervision envoyée à {req.requested_supervisor.email}",
            {"supervision_request_id": req.id},
        )
        serializer = self.get_serializer(req)
        return Response(serializer.data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Retourne l'utilisateur connecté (pour savoir si superviseur, etc.)."""
    user = request.user
    return Response({
        "id": user.id,
        "email": user.email,
        "is_staff": user.is_staff,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def staff_users(request):
    """Liste des utilisateurs is_staff (pour assigner un superviseur à un projet)."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    users = User.objects.filter(is_staff=True).values("id", "email").order_by("email")
    return Response(list(users))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    """
    Tableau de bord : résumé des projets (owner ou superviseur), tâches et nudges.
    Inclut les projets dont l'utilisateur est propriétaire ou superviseur.
    """
    user = request.user
    today = date.today()

    # Projets dont l'utilisateur est propriétaire ou superviseur
    projects = (
        Project.objects.filter(Q(owner=user) | Q(supervisor=user))
        .order_by("-updated_at")
    )
    tasks = Task.objects.filter(Q(project__owner=user) | Q(project__supervisor=user))

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
