from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0004_remove_invoice_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='amount_paid',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=10,
                validators=[django.core.validators.MinValueValidator(0)],
                verbose_name='Montant payé (tranches)',
            ),
        ),
    ]
