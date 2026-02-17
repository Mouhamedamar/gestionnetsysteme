from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0002_invoice_is_proforma'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='company',
            field=models.CharField(
                max_length=20,
                choices=[('NETSYSTEME', 'NETSYSTEME'), ('SSE', 'SSE')],
                default='NETSYSTEME',
                verbose_name='Société',
            ),
        ),
    ]

