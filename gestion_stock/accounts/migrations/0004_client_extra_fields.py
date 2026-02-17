from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_userprofile_page_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='first_name',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Prénom'),
        ),
        migrations.AddField(
            model_name='client',
            name='last_name',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Nom'),
        ),
        migrations.AddField(
            model_name='client',
            name='rccm_number',
            field=models.CharField(blank=True, help_text='Registre du Commerce', max_length=100, null=True, verbose_name='Numéro RCCM'),
        ),
        migrations.AddField(
            model_name='client',
            name='registration_number',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='N° Immatriculation'),
        ),
        migrations.AddField(
            model_name='client',
            name='ninea_number',
            field=models.CharField(blank=True, help_text='Identification fiscale', max_length=50, null=True, verbose_name='Numéro NINEA'),
        ),
    ]
