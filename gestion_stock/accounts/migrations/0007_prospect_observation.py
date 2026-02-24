# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_prospect_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='prospect',
            name='observation',
            field=models.TextField(blank=True, help_text='Notes de suivi (ex: rappeler plus tard, pas intéressé)', null=True, verbose_name='Observation'),
        ),
    ]
