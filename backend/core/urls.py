from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    current_user,
    staff_users,
    ProjectActivityViewSet,
    ProjectCommentViewSet,
    ProjectViewSet,
    ProjectSupervisionRequestViewSet,
    SupervisionRequestViewSet,
    TaskViewSet,
    student_dashboard,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="projects")
router.register(r"tasks", TaskViewSet, basename="tasks")

urlpatterns = [
    path("me/", current_user, name="current-user"),
    path("users/staff/", staff_users, name="staff-users"),
    path(
        "projects/<int:project_pk>/activity/",
        ProjectActivityViewSet.as_view({"get": "list"}),
        name="project-activity-list",
    ),
    path(
        "projects/<int:project_pk>/comments/",
        ProjectCommentViewSet.as_view({"get": "list", "post": "create"}),
        name="project-comments-list",
    ),
    path(
        "projects/<int:project_pk>/supervision-requests/",
        ProjectSupervisionRequestViewSet.as_view(
            {"get": "list", "post": "create"}
        ),
        name="project-supervision-requests-list",
    ),
    path(
        "supervision-requests/<int:pk>/",
        SupervisionRequestViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update"}
        ),
        name="supervision-request-detail",
    ),
    path(
        "supervision-requests/",
        SupervisionRequestViewSet.as_view({"get": "list"}),
        name="supervision-request-list",
    ),
    path(
        "supervision-requests/pending-count/",
        SupervisionRequestViewSet.as_view({"get": "pending_count"}),
        name="supervision-request-pending-count",
    ),
    path("", include(router.urls)),
    path("dashboard/student", student_dashboard),
]
