# Migration pour aligner le schéma avec le rapport de progrès (périmètre réduit)
# Supprime : Milestone, Sprint, Deliverable, Submission, Review, FK sprint de Task

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_add_task_sprint"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="task",
            name="sprint",
        ),
        migrations.DeleteModel(
            name="Review",
        ),
        migrations.DeleteModel(
            name="Submission",
        ),
        migrations.DeleteModel(
            name="Deliverable",
        ),
        migrations.DeleteModel(
            name="Sprint",
        ),
        migrations.DeleteModel(
            name="Milestone",
        ),
    ]
