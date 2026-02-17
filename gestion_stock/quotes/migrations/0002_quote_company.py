from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='quote',
            name='company',
            field=models.CharField(
                choices=[('NETSYSTEME', 'NETSYSTEME'), ('SSE', 'SSE')],
                default='NETSYSTEME',
                max_length=20,
                verbose_name='Société',
            ),
        ),
    ]
