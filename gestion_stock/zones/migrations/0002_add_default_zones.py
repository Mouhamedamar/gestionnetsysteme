# Zones prédéfinies : bureau et chantier (Dakar par défaut)

from decimal import Decimal
from django.db import migrations


def create_default_zones(apps, schema_editor):
    WorkZone = apps.get_model('zones', 'WorkZone')
    if WorkZone.objects.exists():
        return
    # Dakar : 14.7167, -17.4677
    WorkZone.objects.create(
        name='Bureau principal',
        zone_type='bureau',
        radius_m=Decimal('100.00'),
        address='Dakar (zone par défaut)',
        latitude=Decimal('14.7167'),
        longitude=Decimal('-17.4677'),
    )
    WorkZone.objects.create(
        name='Chantier principal',
        zone_type='chantier',
        radius_m=Decimal('150.00'),
        address='Dakar (zone par défaut)',
        latitude=Decimal('14.7167'),
        longitude=Decimal('-17.4677'),
    )


def remove_default_zones(apps, schema_editor):
    WorkZone = apps.get_model('zones', 'WorkZone')
    WorkZone.objects.filter(name__in=('Bureau principal', 'Chantier principal')).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('zones', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_zones, remove_default_zones),
    ]
