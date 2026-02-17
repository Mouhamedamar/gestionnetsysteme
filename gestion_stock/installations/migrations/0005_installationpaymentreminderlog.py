# Generated manually for InstallationPaymentReminderLog

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('installations', '0004_installation_new_form_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='InstallationPaymentReminderLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('due_date', models.DateField(verbose_name="Date d'échéance")),
                ('reminder_type', models.CharField(choices=[('J5', 'J-5 (5 jours avant)'), ('J2', 'J-2 (2 jours avant)'), ('J0', 'Jour J')], default='J0', max_length=5, verbose_name='Type de rappel')),
                ('amount', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='Montant (F)')),
                ('sent_at', models.DateTimeField(auto_now_add=True, verbose_name='Envoyé le')),
                ('installation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_reminder_logs', to='installations.installation', verbose_name='Installation')),
            ],
            options={
                'verbose_name': 'Rappel de paiement envoyé',
                'verbose_name_plural': 'Rappels de paiement envoyés',
                'ordering': ['-sent_at'],
            },
        ),
    ]
