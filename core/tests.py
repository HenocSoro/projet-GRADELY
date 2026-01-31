"""
Tests pour l'API core (projets, tâches).
"""

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from core.models import Project


class ProjectSupervisorAssignmentTest(APITestCase):
    """
    Tests de l'assignation sécurisée du champ supervisor.
    - owner assigne staff → OK
    - owner assigne non-staff → 400
    - non-owner tente assigner supervisor → 403
    - owner tente supervisor=owner → 400
    """

    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner",
            email="owner@test.com",
            password="pass",
            is_staff=False,
        )
        self.staff_user = User.objects.create_user(
            username="staff",
            email="staff@test.com",
            password="pass",
            is_staff=True,
        )
        self.student = User.objects.create_user(
            username="student",
            email="student@test.com",
            password="pass",
            is_staff=False,
        )
        self.project = Project.objects.create(
            title="Projet test", owner=self.owner, supervisor=None
        )

    def test_owner_assigns_staff_ok(self):
        """Owner peut assigner un enseignant (is_staff) comme supervisor."""
        self.client.force_authenticate(user=self.owner)
        resp = self.client.patch(
            f"/api/projects/{self.project.id}/",
            {"supervisor": self.staff_user.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.supervisor_id, self.staff_user.id)

    def test_owner_assigns_non_staff_returns_400(self):
        """Owner ne peut pas assigner un non-staff comme supervisor."""
        self.client.force_authenticate(user=self.owner)
        resp = self.client.patch(
            f"/api/projects/{self.project.id}/",
            {"supervisor": self.student.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("supervisor", resp.json())
        self.project.refresh_from_db()
        self.assertIsNone(self.project.supervisor_id)

    def test_non_owner_cannot_assign_supervisor_returns_403(self):
        """Un superviseur (ou autre non-owner) ne peut pas modifier supervisor."""
        self.project.supervisor = self.staff_user
        self.project.save()
        self.client.force_authenticate(user=self.staff_user)
        other_staff = User.objects.create_user(
            username="other_staff",
            email="other@test.com",
            password="pass",
            is_staff=True,
        )
        resp = self.client.patch(
            f"/api/projects/{self.project.id}/",
            {"supervisor": other_staff.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.project.refresh_from_db()
        self.assertEqual(self.project.supervisor_id, self.staff_user.id)

    def test_owner_cannot_assign_self_as_supervisor_returns_400(self):
        """Owner ne peut pas s'assigner lui-même comme supervisor."""
        self.client.force_authenticate(user=self.owner)
        resp = self.client.patch(
            f"/api/projects/{self.project.id}/",
            {"supervisor": self.owner.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("supervisor", resp.json())
        self.project.refresh_from_db()
        self.assertIsNone(self.project.supervisor_id)
