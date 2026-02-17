from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0003_remove_quote_status_add_converted_invoice'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='quote',
            name='notes',
        ),
    ]
