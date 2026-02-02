"""
Permissions par rôle pour l'API.

Règles métier :
- Étudiant (owner) : lecture + écriture (CRUD) sur ses projets
- Superviseur : lecture seule sur les projets qui lui sont assignés
"""

from rest_framework import permissions


class IsProjectOwnerOrSupervisor(permissions.BasePermission):
    """
    Permission pour les projets.

    - GET (liste, détail) : autorisé si user est owner OU supervisor du projet
    - POST (création) : autorisé pour tout utilisateur authentifié (owner = request.user)
    - PUT, PATCH, DELETE : autorisé uniquement pour l'owner
    """

    def has_permission(self, request, view):
        # Seuls les utilisateurs authentifiés peuvent accéder
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        # Méthodes sûres (GET, HEAD, OPTIONS) : owner ou supervisor
        if request.method in permissions.SAFE_METHODS:
            return obj.owner_id == request.user.id or obj.supervisor_id == request.user.id

        # Méthodes d'écriture : uniquement l'owner
        return obj.owner_id == request.user.id


class IsProjectMember(permissions.BasePermission):
    """
    Permission pour les tâches : l'utilisateur doit être owner ou supervisor
    du projet parent pour accéder aux tâches.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        project = obj.project
        return (
            project.owner_id == request.user.id or project.supervisor_id == request.user.id
        )


class IsSupervisorForReview(permissions.BasePermission):
    """
    Permission pour la revue : seul le superviseur du projet peut valider (approve/reject).
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        # obj est la Submission
        project = obj.deliverable.project
        # Lecture : owner ou supervisor
        if request.method in permissions.SAFE_METHODS:
            return (
                project.owner_id == request.user.id
                or project.supervisor_id == request.user.id
            )
        # Écriture (POST review) : uniquement le superviseur
        return project.supervisor_id == request.user.id
