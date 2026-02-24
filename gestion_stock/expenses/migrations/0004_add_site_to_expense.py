# Generated migration: add site field (Dakar / Mbour) to Expense

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('expenses', '0003_rename_expenses_exp_category_idx_expenses_ex_categor_fcaba7_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='expense',
            name='site',
            field=models.CharField(
                choices=[('DAKAR', 'Dakar'), ('MBOUR', 'Mbour')],
                default='DAKAR',
                help_text='Site concerné (Dakar ou Mbour)',
                max_length=20,
                verbose_name='Site'
            ),
        ),
    ]
