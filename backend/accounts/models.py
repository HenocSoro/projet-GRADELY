from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        SUPERVISOR = "SUPERVISOR", "Supervisor"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]  # garde username pour éviter des soucis admin

    def save(self, *args, **kwargs):
        # Synchroniser role avec is_staff : staff = Supervisor, sinon = Student
        if self.is_staff or self.is_superuser:
            self.role = self.Role.SUPERVISOR
        else:
            self.role = self.Role.STUDENT
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.role})"
