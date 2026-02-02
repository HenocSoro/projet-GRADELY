from django.contrib import admin
from .models import (
    ActivityLog,
    Comment,
    Deliverable,
    Milestone,
    Project,
    Review,
    Sprint,
    Submission,
    Task,
)


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


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "actor", "action_type", "created_at")
    list_filter = ("action_type",)
    search_fields = ("description", "project__title")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "author", "created_at")
    search_fields = ("content", "project__title")


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "title", "status", "due_date", "order")
    list_filter = ("status",)
    search_fields = ("title", "project__title")


@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "title", "start_date", "end_date", "status")
    list_filter = ("status",)
    search_fields = ("title", "project__title")


@admin.register(Deliverable)
class DeliverableAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "title", "due_date")
    search_fields = ("title", "project__title")


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "deliverable", "submitted_by", "status", "submitted_at")
    list_filter = ("status",)
    search_fields = ("deliverable__title",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "submission", "reviewer", "status", "reviewed_at")
    list_filter = ("status",)
