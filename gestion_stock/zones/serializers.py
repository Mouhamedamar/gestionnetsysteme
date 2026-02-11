from rest_framework import serializers
from .models import WorkZone


class WorkZoneSerializer(serializers.ModelSerializer):
    zone_type_display = serializers.CharField(source='get_zone_type_display', read_only=True)

    class Meta:
        model = WorkZone
        fields = [
            'id',
            'name',
            'radius_m',
            'zone_type',
            'zone_type_display',
            'address',
            'latitude',
            'longitude',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
