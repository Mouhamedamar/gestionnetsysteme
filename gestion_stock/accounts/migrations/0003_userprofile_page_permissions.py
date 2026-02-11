# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_userprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='page_permissions',
            field=models.JSONField(blank=True, default=None, help_text="Liste des chemins de pages autorisés pour cet utilisateur", null=True, verbose_name='Permissions par page'),
        ),
    ]
