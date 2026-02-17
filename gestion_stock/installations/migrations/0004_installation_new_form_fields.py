from decimal import Decimal
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0004_remove_invoice_status'),
        ('installations', '0003_installation_description_optional'),
    ]

    operations = [
        # Installation: nouveaux champs
        migrations.AddField(
            model_name='installation',
            name='installation_date',
            field=models.DateField(blank=True, null=True, verbose_name="Date d'installation"),
        ),
        migrations.AddField(
            model_name='installation',
            name='payment_method',
            field=models.CharField(
                blank=True,
                choices=[
                    ('ESPECE', 'Espèce (Comptant)'),
                    ('1_TRANCHE', '1 tranche'),
                    ('2_TRANCHES', '2 tranches'),
                    ('3_TRANCHES', '3 tranches'),
                    ('4_TRANCHES', '4 tranches'),
                ],
                max_length=20,
                null=True,
                verbose_name='Méthode de paiement',
            ),
        ),
        migrations.AddField(
            model_name='installation',
            name='first_installment_due_date',
            field=models.DateField(blank=True, null=True, verbose_name="Date d'échéance (1ère tranche)"),
        ),
        migrations.AddField(
            model_name='installation',
            name='total_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0'),
                max_digits=12,
                validators=[django.core.validators.MinValueValidator(0)],
                verbose_name='Montant total (F)',
            ),
        ),
        migrations.AddField(
            model_name='installation',
            name='advance_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0'),
                max_digits=12,
                validators=[django.core.validators.MinValueValidator(0)],
                verbose_name='Avance - 1ère tranche (F)',
            ),
        ),
        migrations.AddField(
            model_name='installation',
            name='remaining_amount',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                default=Decimal('0'),
                max_digits=12,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                verbose_name='Restant à payer (F)',
            ),
        ),
        migrations.AddField(
            model_name='installation',
            name='commercial_agent',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='installations_as_commercial',
                to='auth.user',
                verbose_name='Agent commercial',
            ),
        ),
        migrations.AddField(
            model_name='installation',
            name='invoice',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='installations',
                to='invoices.invoice',
                verbose_name='Facture associée',
            ),
        ),
        migrations.AddField(
            model_name='installation',
            name='contract_file',
            field=models.FileField(blank=True, null=True, upload_to='installation_contracts/%Y/%m/', verbose_name='Contrat (PDF ou image)'),
        ),
        migrations.AddField(
            model_name='installation',
            name='technicians',
            field=models.ManyToManyField(
                blank=True,
                related_name='installations_as_technician',
                to='auth.user',
                verbose_name='Techniciens',
            ),
        ),
        # InstallationProduct: prix unitaire
        migrations.AddField(
            model_name='installationproduct',
            name='unit_price',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0'),
                max_digits=12,
                validators=[django.core.validators.MinValueValidator(0)],
                verbose_name='Prix unitaire (F)',
            ),
        ),
        # Retirer unique_together pour permettre plusieurs lignes même produit
        migrations.AlterUniqueTogether(
            name='installationproduct',
            unique_together=set(),
        ),
    ]
