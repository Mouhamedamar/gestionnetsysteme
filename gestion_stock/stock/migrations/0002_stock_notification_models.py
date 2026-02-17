# Generated manually for stock notification models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stock', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='StockAlertSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alert_threshold', models.IntegerField(default=10, verbose_name="Seuil d'alerte (unités)")),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': "Paramètres alerte stock",
                'verbose_name_plural': "Paramètres alerte stock",
            },
        ),
        migrations.CreateModel(
            name='StockNotificationRecipient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120, verbose_name='Nom du responsable')),
                ('phone', models.CharField(max_length=20, verbose_name='Numéro de téléphone')),
                ('is_active', models.BooleanField(default=True, verbose_name='Actif')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Responsable SMS Stock',
                'verbose_name_plural': 'Responsables SMS Stock',
                'ordering': ['name'],
            },
        ),
    ]
