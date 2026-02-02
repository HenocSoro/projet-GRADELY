"""
Serializers pour l'API des projets et tâches.

Séparation claire des champs :
- read_only : renvoyés par l'API, non modifiables par le client
- write : modifiables à la création ou mise à jour
"""

import os

from rest_framework import serializers

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


class TaskSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les tâches d'un projet.
    Le champ 'project' est requis à la création.
    'sprint' optionnel : doit appartenir au même projet.
    """

    sprint_title = serializers.CharField(source="sprint.title", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "sprint",
            "sprint_title",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "blocked_since",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "sprint_title", "blocked_since", "created_at", "updated_at"]

    def validate_sprint(self, value):
        if value is None:
            return value
        project_id = self.initial_data.get("project") or (
            self.instance.project_id if self.instance else None
        )
        if project_id is not None and value.project_id != int(project_id):
            raise serializers.ValidationError(
                "Le sprint doit appartenir au même projet que la tâche."
            )
        return value

    def validate(self, attrs):
        sprint = attrs.get("sprint")
        due_date = attrs.get("due_date")
        if sprint is None and self.instance and "sprint" not in attrs:
            sprint = self.instance.sprint
        if due_date is None and self.instance and "due_date" not in attrs:
            due_date = self.instance.due_date
        if sprint is not None and due_date is not None and due_date > sprint.end_date:
            raise serializers.ValidationError(
                {
                    "due_date": (
                        f"La date d'échéance de la tâche ({due_date}) ne peut pas être "
                        f"postérieure à la date de fin du sprint « {sprint.title} » ({sprint.end_date})."
                    )
                }
            )
        return attrs


class ProjectSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les projets.

    - owner : défini automatiquement côté serveur (request.user), en lecture seule
    - supervisor : optionnel, assignable uniquement par l'owner ; doit être is_staff
    - progress_percent : calculé à partir des tâches, en lecture seule
    """

    progress_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "owner",
            "supervisor",
            "title",
            "description",
            "status",
            "start_date",
            "end_date",
            "progress_percent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "progress_percent", "created_at", "updated_at"]

    def validate_supervisor(self, value):
        """
        Le supervisor doit être un enseignant (is_staff) et ne peut pas être l'owner.
        Null autorisé (supervisor optionnel).
        """
        if value is None:
            return value
        # Enseignant = is_staff ou is_superuser (simple, sans système de rôles)
        if not (value.is_staff or value.is_superuser):
            raise serializers.ValidationError(
                "Le superviseur doit être un enseignant (staff)."
            )
        return value

    def validate(self, attrs):
        """Interdit supervisor = owner (cross-field validation)."""
        supervisor = attrs.get("supervisor")
        owner = self.instance.owner if self.instance else None
        if owner is None:
            request = self.context.get("request")
            owner = request.user if request else None
        if owner is not None and supervisor and supervisor.id == owner.id:
            raise serializers.ValidationError(
                {"supervisor": "Le superviseur ne peut pas être l'owner du projet."}
            )
        return attrs


class ActivityLogSerializer(serializers.ModelSerializer):
    """Journal d'activité (lecture seule)."""

    actor_email = serializers.CharField(source="actor.email", read_only=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "actor", "actor_email", "action_type", "description", "metadata", "created_at"]
        read_only_fields = fields


class MilestoneSerializer(serializers.ModelSerializer):
    """Jalon du projet. project défini par la vue (nested create)."""

    class Meta:
        model = Milestone
        fields = ["id", "project", "title", "description", "due_date", "status", "order", "created_at"]
        read_only_fields = ["id", "project", "created_at"]
        extra_kwargs = {"description": {"allow_blank": True, "required": False}}


class SprintSerializer(serializers.ModelSerializer):
    """Sprint du projet. project défini par la vue (nested create)."""

    class Meta:
        model = Sprint
        fields = ["id", "project", "title", "start_date", "end_date", "goal", "status", "created_at"]
        read_only_fields = ["id", "project", "created_at"]
        extra_kwargs = {"goal": {"allow_blank": True, "required": False}}


class DeliverableSerializer(serializers.ModelSerializer):
    """Livrable du projet. project est défini par la vue à la création."""

    class Meta:
        model = Deliverable
        fields = ["id", "project", "title", "description", "due_date", "created_at"]
        read_only_fields = ["id", "project", "created_at"]


class SubmissionSerializer(serializers.ModelSerializer):
    """Dépôt d'un livrable (texte + fichier optionnel)."""

    submitted_by_email = serializers.CharField(
        source="submitted_by.email", read_only=True
    )
    document_url = serializers.SerializerMethodField()
    document_name = serializers.SerializerMethodField()

    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.document.url)
            return obj.document.url
        return None

    def get_document_name(self, obj):
        if obj.document and obj.document.name:
            return os.path.basename(obj.document.name)
        return None

    class Meta:
        model = Submission
        fields = [
            "id",
            "deliverable",
            "submitted_by",
            "submitted_by_email",
            "content",
            "file_url",
            "document",
            "document_url",
            "document_name",
            "status",
            "submitted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "deliverable",
            "submitted_by",
            "submitted_by_email",
            "document_url",
            "document_name",
            "submitted_at",
            "created_at",
            "updated_at",
        ]


class ReviewSerializer(serializers.ModelSerializer):
    """Revue/validation d'un dépôt par le superviseur."""

    reviewer_email = serializers.CharField(source="reviewer.email", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "submission",
            "reviewer",
            "reviewer_email",
            "status",
            "feedback",
            "reviewed_at",
        ]
        read_only_fields = ["id", "reviewer", "reviewer_email", "reviewed_at"]


class SubmissionDetailSerializer(SubmissionSerializer):
    """Dépôt avec sa revue (pour GET)."""

    review = serializers.SerializerMethodField()

    def get_review(self, obj):
        if hasattr(obj, "review"):
            return ReviewSerializer(obj.review).data
        return None

    class Meta(SubmissionSerializer.Meta):
        fields = SubmissionSerializer.Meta.fields + ["review"]


class CommentSerializer(serializers.ModelSerializer):
    """Commentaire sur un projet."""

    author_email = serializers.CharField(source="author.email", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "project", "author", "author_email", "content", "created_at"]
        read_only_fields = ["id", "author", "author_email", "created_at"]


class SupervisionRequestSerializer(serializers.ModelSerializer):
    """Demande de supervision (étudiant → prof)."""

    project_title = serializers.CharField(source="project.title", read_only=True)
    project_id = serializers.IntegerField(source="project.id", read_only=True)
    requested_supervisor_email = serializers.CharField(
        source="requested_supervisor.email", read_only=True
    )
    owner_email = serializers.CharField(source="project.owner.email", read_only=True)
    direction = serializers.SerializerMethodField()

    def get_direction(self, obj):
        request = self.context.get("request")
        if request and request.user.id == obj.requested_supervisor_id:
            return "received"
        return "sent"

    class Meta:
        model = SupervisionRequest
        fields = [
            "id",
            "project",
            "project_id",
            "project_title",
            "requested_supervisor",
            "requested_supervisor_email",
            "owner_email",
            "status",
            "message",
            "response_message",
            "created_at",
            "responded_at",
            "direction",
        ]
        read_only_fields = [
            "id",
            "project",
            "project_title",
            "project_id",
            "requested_supervisor_email",
            "owner_email",
            "status",
            "response_message",
            "responded_at",
            "direction",
        ]
