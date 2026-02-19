# Migration: ajout du champ email pour les notifications stock par email

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stock', '0002_stock_notification_models'),
    ]

    operations = [
        migrations.AddField(
            model_name='stocknotificationrecipient',
            name='email',
            field=models.EmailField(blank=True, default='', max_length=254, verbose_name='Adresse email'),
        ),
        migrations.AlterField(
            model_name='stocknotificationrecipient',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=20, verbose_name='Numéro de téléphone'),
        ),
        migrations.AlterModelOptions(
            name='stocknotificationrecipient',
            options={
                'verbose_name': 'Responsable notifications stock',
                'verbose_name_plural': 'Responsables notifications stock',
                'ordering': ['name'],
            },
        ),
    ]
