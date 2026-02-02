from django.contrib import admin
from .models import Project, Task


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "owner", "supervisor", "status", "created_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("title", "owner__email")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "project", "status", "due_date", "blocked_since", "updated_at")
    list_filter = ("status",)
    search_fields = ("title", "project__title")
