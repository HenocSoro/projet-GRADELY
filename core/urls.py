from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TaskViewSet, student_dashboard

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="projects")
router.register(r"tasks", TaskViewSet, basename="tasks")

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/student", student_dashboard),
]
