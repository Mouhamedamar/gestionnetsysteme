from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_client_type_blacklist_observation'),
    ]

    operations = [
        migrations.CreateModel(
            name='Prospect',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='Nom')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, verbose_name='Email')),
                ('phone', models.CharField(blank=True, max_length=20, null=True, verbose_name='Téléphone')),
                ('company', models.CharField(
                    max_length=200,
                    blank=True,
                    null=True,
                    verbose_name='Entreprise',
                    help_text="Nom de l'entreprise ou du contact"
                )),
                ('status', models.CharField(
                    max_length=20,
                    choices=[
                        ('new', 'Nouveau'),
                        ('contacted', 'Contacté'),
                        ('converted', 'Converti'),
                        ('lost', 'Perdu'),
                    ],
                    default='new',
                    verbose_name='Statut',
                    help_text='Statut du prospect dans le tunnel commercial'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Date de création')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Date de modification')),
            ],
            options={
                'verbose_name': 'Prospect',
                'verbose_name_plural': 'Prospects',
                'ordering': ['-created_at'],
            },
        ),
    ]

