# Generated migration for reminder_interval_days and last_reminder_sent_at

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stock', '0003_stocknotificationrecipient_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='stockalertsettings',
            name='reminder_interval_days',
            field=models.IntegerField(
                default=0,
                help_text='0 = désactivé. 1, 2, 3 ou 7 = envoyer un rappel stock faible tous les X jours.',
                verbose_name='Rappel automatique (jours)',
            ),
        ),
        migrations.AddField(
            model_name='stockalertsettings',
            name='last_reminder_sent_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name="Dernier rappel envoyé le"),
        ),
    ]
