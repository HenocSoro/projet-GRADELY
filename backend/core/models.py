from django.conf import settings
from django.db import models
from django.utils import timezone


class Project(models.Model):
    """
    Projet universitaire.
    - owner : étudiant propriétaire (crée le projet, accès complet)
    - supervisor : enseignant assigné (lecture des projets qui lui sont assignés)
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
        help_text="Étudiant propriétaire du projet",
    )
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supervised_projects",
        help_text="Enseignant superviseur du projet",
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def progress_percent(self) -> int:
        total = self.tasks.count()
        if total == 0:
            return 0
        done = self.tasks.filter(status=Task.Status.DONE).count()
        return int((done / total) * 100)

    def __str__(self):
        return self.title


class Task(models.Model):
    """
    Tâche rattachée à un projet.
    Les statuts permettent de suivre l'avancement (TODO -> IN_PROGRESS -> DONE).
    """

    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        BLOCKED = "blocked", "Blocked"
        DONE = "done", "Done"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.IntegerField(default=3)
    due_date = models.DateField(null=True, blank=True)

    blocked_since = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_status(self, new_status: str, save: bool = True):
        if new_status == self.Status.BLOCKED and self.blocked_since is None:
            self.blocked_since = timezone.now()
        if self.status == self.Status.BLOCKED and new_status != self.Status.BLOCKED:
            self.blocked_since = None
        self.status = new_status
        if save:
            self.save(update_fields=["status", "blocked_since", "updated_at"])

    def __str__(self):
        return self.title


class ActivityLog(models.Model):
    """
    Journal d'activité par projet.
    Chaque action importante (création, mise à jour, commentaire) crée une entrée.
    """

    class ActionType(models.TextChoices):
        PROJECT_CREATED = "project_created", "Projet créé"
        PROJECT_UPDATED = "project_updated", "Projet modifié"
        TASK_CREATED = "task_created", "Tâche créée"
        TASK_UPDATED = "task_updated", "Tâche modifiée"
        COMMENT_ADDED = "comment_added", "Commentaire ajouté"
        SUPERVISION_REQUEST_SENT = "supervision_request_sent", "Demande de supervision envoyée"
        SUPERVISION_REQUEST_ACCEPTED = "supervision_request_accepted", "Demande de supervision acceptée"
        SUPERVISION_REQUEST_DECLINED = "supervision_request_declined", "Demande de supervision refusée"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="activity_logs"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_logs",
    )
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action_type} - {self.project.title}"


class Comment(models.Model):
    """
    Commentaire sur un projet.
    Owner et superviseur peuvent commenter.
    """

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_comments",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.author} - {self.project.title}"


class SupervisionRequest(models.Model):
    """
    Demande de supervision : l'étudiant (owner) envoie une demande à un prof (requested_supervisor).
    Le prof peut accepter ou refuser. Si accepté, project.supervisor est assigné.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        ACCEPTED = "accepted", "Acceptée"
        DECLINED = "declined", "Refusée"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="supervision_requests",
    )
    requested_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="supervision_requests_received",
        help_text="Enseignant à qui la demande est envoyée",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    message = models.TextField(
        blank=True,
        help_text="Message optionnel de l'étudiant",
    )
    response_message = models.TextField(
        blank=True,
        help_text="Message du superviseur (refus ou confirmation)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "requested_supervisor"],
                condition=models.Q(status="pending"),
                name="unique_pending_supervision_request_per_project_supervisor",
            )
        ]

    def __str__(self):
        return f"{self.project.title} → {self.requested_supervisor.email} ({self.status})"
