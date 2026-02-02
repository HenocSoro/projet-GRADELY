from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = ("email", "username", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")

    fieldsets = (
        (None, {"fields": ("email", "password", "username")}),
        ("Rôle", {"fields": ("role",), "description": "Student = étudiant, Supervisor = prof/superviseur. Staff status est synchronisé automatiquement."}),
        ("Permissions", {"fields": ("is_staff", "is_active", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2", "role", "is_active"),
        }),
    )

    search_fields = ("email", "username")
    ordering = ("email",)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj is None:
            # Nouveau user : actif par défaut, étudiant par défaut
            if "is_active" in form.base_fields:
                form.base_fields["is_active"].initial = True
            if "role" in form.base_fields:
                form.base_fields["role"].initial = User.Role.STUDENT
        return form

    def save_model(self, request, obj, form, change):
        # Synchroniser is_staff avec le rôle choisi : Supervisor = staff, Student = pas staff
        obj.is_staff = obj.role == User.Role.SUPERVISOR
        super().save_model(request, obj, form, change)
