from rest_framework import serializers
from .models import CheckIn


class CheckInSerializer(serializers.ModelSerializer):
    check_type_display = serializers.CharField(source='get_check_type_display', read_only=True)
    username = serializers.SerializerMethodField(read_only=True)
    zone_name = serializers.SerializerMethodField(read_only=True)
    work_zone_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CheckIn
        fields = [
            'id',
            'user',
            'username',
            'work_zone',
            'zone_name',
            'work_zone_details',
            'check_type',
            'check_type_display',
            'timestamp',
            'note',
            'latitude',
            'longitude',
        ]
        read_only_fields = ['id', 'user', 'timestamp']

    def get_username(self, obj):
        if obj and getattr(obj, 'user', None):
            return getattr(obj.user, 'username', None)
        return None

    def get_zone_name(self, obj):
        if obj and getattr(obj, 'work_zone', None):
            return getattr(obj.work_zone, 'name', None)
        return 'Sans zone'

    def get_work_zone_details(self, obj):
        """Détails de la zone pour afficher la carte (lat, lng, rayon, nom, adresse)."""
        if obj and getattr(obj, 'work_zone', None):
            z = obj.work_zone
            return {
                'id': z.id,
                'name': getattr(z, 'name', None),
                'address': getattr(z, 'address', None) or '',
                'zone_type': getattr(z, 'zone_type', None),
                'latitude': float(z.latitude) if z.latitude is not None else None,
                'longitude': float(z.longitude) if z.longitude is not None else None,
                'radius_m': float(z.radius_m) if z.radius_m is not None else None,
            }
        return {
            'id': None,
            'name': 'Sans zone',
            'address': '',
            'zone_type': 'bureau',
            'latitude': 14.7167,
            'longitude': -17.4677,
            'radius_m': 100,
        }
