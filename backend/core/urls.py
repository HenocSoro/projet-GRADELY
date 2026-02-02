from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    current_user,
    staff_users,
    DeliverableSubmissionViewSet,
    ProjectActivityViewSet,
    ProjectCommentViewSet,
    ProjectDeliverableViewSet,
    ProjectMilestoneViewSet,
    ProjectSprintViewSet,
    ProjectViewSet,
    ProjectSupervisionRequestViewSet,
    SubmissionReviewView,
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
    # Nested: activity et commentaires par projet
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
        "projects/<int:project_pk>/milestones/",
        ProjectMilestoneViewSet.as_view({"get": "list", "post": "create"}),
        name="project-milestones-list",
    ),
    path(
        "projects/<int:project_pk>/milestones/<int:pk>/",
        ProjectMilestoneViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-milestones-detail",
    ),
    path(
        "projects/<int:project_pk>/sprints/",
        ProjectSprintViewSet.as_view({"get": "list", "post": "create"}),
        name="project-sprints-list",
    ),
    path(
        "projects/<int:project_pk>/sprints/<int:pk>/",
        ProjectSprintViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-sprints-detail",
    ),
    path(
        "projects/<int:project_pk>/deliverables/",
        ProjectDeliverableViewSet.as_view({"get": "list", "post": "create"}),
        name="project-deliverables-list",
    ),
    path(
        "projects/<int:project_pk>/deliverables/<int:pk>/",
        ProjectDeliverableViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-deliverables-detail",
    ),
    path(
        "projects/<int:project_pk>/deliverables/<int:deliverable_pk>/submissions/",
        DeliverableSubmissionViewSet.as_view({"get": "list", "post": "create"}),
        name="deliverable-submissions-list",
    ),
    path(
        "projects/<int:project_pk>/deliverables/<int:deliverable_pk>/submissions/<int:pk>/",
        DeliverableSubmissionViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="deliverable-submissions-detail",
    ),
    path(
        "submissions/<int:submission_pk>/review/",
        SubmissionReviewView.as_view(),
        name="submission-review",
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
