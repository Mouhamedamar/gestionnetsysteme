# Generated migration to add justification_image field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expenses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='expense',
            name='justification_image',
            field=models.ImageField(blank=True, null=True, upload_to='expenses/', verbose_name='Image de justification'),
        ),
    ]
