from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0003_invoice_company'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='invoice',
            name='invoices_in_status_cec546_idx',
        ),
        migrations.RemoveField(
            model_name='invoice',
            name='status',
        ),
    ]
