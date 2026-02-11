# Generated migration for expenses app

import django.core.validators
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='Titre de la dépense')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Description')),
                ('category', models.CharField(choices=[('FOURNITURE', 'Fourniture'), ('TRANSPORT', 'Transport'), ('SALAIRE', 'Salaire'), ('LOYER', 'Loyer'), ('UTILITAIRE', 'Utilitaires'), ('MARKETING', 'Marketing'), ('MAINTENANCE', 'Maintenance'), ('AUTRE', 'Autre')], default='AUTRE', max_length=20, verbose_name='Catégorie')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)], verbose_name='Montant')),
                ('date', models.DateTimeField(default=django.utils.timezone.now, verbose_name='Date')),
                ('status', models.CharField(choices=[('PAYE', 'Payé'), ('NON_PAYE', 'Non payé')], default='NON_PAYE', max_length=10, verbose_name='Statut')),
                ('supplier', models.CharField(blank=True, max_length=200, null=True, verbose_name='Fournisseur')),
                ('receipt_number', models.CharField(blank=True, max_length=100, null=True, verbose_name='Numéro de reçu')),
                ('justification_image', models.ImageField(blank=True, null=True, upload_to='expenses/', verbose_name='Image de justification')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Date de création')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Date de modification')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Date de suppression')),
            ],
            options={
                'verbose_name': 'Dépense',
                'verbose_name_plural': 'Dépenses',
                'ordering': ['-date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='expense',
            index=models.Index(fields=['category'], name='expenses_exp_category_idx'),
        ),
        migrations.AddIndex(
            model_name='expense',
            index=models.Index(fields=['status'], name='expenses_exp_status_idx'),
        ),
        migrations.AddIndex(
            model_name='expense',
            index=models.Index(fields=['date'], name='expenses_exp_date_idx'),
        ),
        migrations.AddIndex(
            model_name='expense',
            index=models.Index(fields=['deleted_at'], name='expenses_exp_deleted__idx'),
        ),
    ]
