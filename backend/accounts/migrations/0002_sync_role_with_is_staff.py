# Generated migration: synchronise role avec is_staff pour les utilisateurs existants

from django.db import migrations


def sync_role(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(is_staff=True).update(role="SUPERVISOR")
    User.objects.filter(is_superuser=True).update(role="SUPERVISOR")
    User.objects.filter(is_staff=False, is_superuser=False).update(role="STUDENT")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(sync_role, noop),
    ]
