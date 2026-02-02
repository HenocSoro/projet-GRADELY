"""
Services métier pour le module core.
"""

from .models import ActivityLog


def log_activity(project, actor, action_type, description, metadata=None):
    """
    Crée une entrée dans le journal d'activité du projet.

    Args:
        project: instance Project
        actor: instance User (auteur de l'action)
        action_type: valeur de ActivityLog.ActionType
        description: texte descriptif
        metadata: dict optionnel (ex: {"task_id": 1, "field": "status"})
    """
    ActivityLog.objects.create(
        project=project,
        actor=actor,
        action_type=action_type,
        description=description,
        metadata=metadata or {},
    )
