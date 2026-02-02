"""
Serializers pour l'API des projets et tâches.

Séparation claire des champs :
- read_only : renvoyés par l'API, non modifiables par le client
- write : modifiables à la création ou mise à jour
"""

from rest_framework import serializers

from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les tâches d'un projet.
    Le champ 'project' est requis à la création.
    """

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "blocked_since",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "blocked_since", "created_at", "updated_at"]


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
