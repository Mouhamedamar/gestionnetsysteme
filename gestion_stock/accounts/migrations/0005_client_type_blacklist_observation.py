from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_client_extra_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='company',
            field=models.CharField(blank=True, help_text="Nom de l'entreprise", max_length=200, null=True, verbose_name='Entreprise'),
        ),
        migrations.AddField(
            model_name='client',
            name='client_type',
            field=models.CharField(
                choices=[('PROSPECT', 'Prospect'), ('CLIENT', 'Client')],
                default='PROSPECT',
                help_text='Prospect ou Client',
                max_length=20,
                verbose_name='Type',
            ),
        ),
        migrations.AddField(
            model_name='client',
            name='is_blacklisted',
            field=models.BooleanField(default=False, help_text='Ne plus contacter ce prospect/client', verbose_name='Blacklisté'),
        ),
        migrations.AddField(
            model_name='client',
            name='observation',
            field=models.TextField(blank=True, help_text="Notes de suivi (ex: n'est pas intéressé, rappeler plus tard)", null=True, verbose_name='Observation'),
        ),
    ]
