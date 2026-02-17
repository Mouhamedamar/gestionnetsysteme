from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0004_remove_invoice_status'),
        ('quotes', '0002_quote_company'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='quote',
            name='quotes_quot_status_bc6cd2_idx',
        ),
        migrations.RemoveField(
            model_name='quote',
            name='status',
        ),
        migrations.AddField(
            model_name='quote',
            name='converted_invoice',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='source_quote',
                to='invoices.invoice',
                verbose_name='Facture issue du devis',
            ),
        ),
    ]
