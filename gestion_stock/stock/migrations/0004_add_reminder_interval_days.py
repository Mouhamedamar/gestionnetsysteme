# Migration: rappel automatique stock faible (intervalle en jours)

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('stock', '0003_stocknotificationrecipient_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='stockalertsettings',
            name='reminder_interval_days',
            field=models.IntegerField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(1)],
                verbose_name='Rappel automatique (tous les X jours)',
            ),
        ),
        migrations.AddField(
            model_name='stockalertsettings',
            name='last_reminder_sent_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Dernier rappel envoyé le'),
        ),
    ]
