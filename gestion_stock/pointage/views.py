import math
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
from .models import CheckIn
from .serializers import CheckInSerializer
from .permissions import PointagePermission, user_is_admin
from .filters import CheckInFilter
from zones.models import WorkZone


def distance_meters(lat1, lon1, lat2, lon2):
    """Distance en mètres entre deux points (formule de Haversine)."""
    R = 6371000
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    dphi = math.radians(float(lat2 - lat1))
    dlambda = math.radians(float(lon2 - lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class CheckInViewSet(viewsets.ModelViewSet):
    """
    Pointage (entrée/sortie).
    - Admin : peut voir tous les pointages (GET), filtrer par user, work_zone, check_type, date.
    - Autres : voient et créent uniquement leurs propres pointages.
    """
    serializer_class = CheckInSerializer
    permission_classes = [PointagePermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = CheckInFilter
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        try:
            qs = CheckIn.objects.select_related('user', 'work_zone')
            if user_is_admin(self.request.user):
                return qs.all()
            return qs.filter(user=self.request.user)
        except Exception:
            return CheckIn.objects.none()

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            if settings.DEBUG:
                return Response(
                    {'detail': str(e), 'error_type': type(e).__name__},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            raise

    def create(self, request, *args, **kwargs):
        data = request.data
        lat_in = data.get('latitude')
        lng_in = data.get('longitude')
        is_admin = user_is_admin(request.user)

        if not is_admin:
            # Utilisateur non-admin : position obligatoire, zone déterminée par le serveur (pas de choix de zone)
            try:
                lat = float(lat_in) if lat_in is not None else None
                lng = float(lng_in) if lng_in is not None else None
            except (TypeError, ValueError):
                lat = lng = None
            if lat is None or lng is None:
                return Response(
                    {'detail': 'Position requise pour pointer. Autorisez la géolocalisation.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Seules les zones de travail créées (avec coordonnées et rayon) permettent de pointer
            zones_with_coords = WorkZone.objects.filter(
                latitude__isnull=False, longitude__isnull=False, radius_m__isnull=False
            ).order_by('id')
            work_zone = None
            for zone in zones_with_coords:
                z_lat = float(zone.latitude)
                z_lng = float(zone.longitude)
                z_radius = float(zone.radius_m)
                dist = distance_meters(lat, lng, z_lat, z_lng)
                if dist <= z_radius:
                    work_zone = zone
                    break
            if work_zone is None:
                # Trouver la zone la plus proche pour le message d'erreur
                nearest_zone = None
                nearest_dist = None
                for zone in zones_with_coords:
                    z_lat = float(zone.latitude)
                    z_lng = float(zone.longitude)
                    z_radius = float(zone.radius_m)
                    d = distance_meters(lat, lng, z_lat, z_lng)
                    if nearest_dist is None or d < nearest_dist:
                        nearest_dist = d
                        nearest_zone = zone
                if nearest_zone:
                    return Response(
                        {
                            'detail': (
                                f'Vous n\'êtes pas dans la zone créée. '
                                f'Zone la plus proche : {nearest_zone.name}. '
                                f'Distance : {int(nearest_dist)} m (rayon autorisé : {int(nearest_zone.radius_m)} m).'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                return Response(
                    {'detail': 'Aucune zone de travail configurée. Vous ne pouvez pas pointer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # work_zone est la zone dans laquelle l'utilisateur est (première trouvée)
            data_for_serializer = {k: data[k] for k in ('check_type', 'note') if k in data}
            data_for_serializer['work_zone'] = work_zone.id
            data_for_serializer['latitude'] = lat
            data_for_serializer['longitude'] = lng
        else:
            # Admin : comportement optionnel (zone et position optionnels)
            work_zone_id = data.get('work_zone')
            if work_zone_id is not None:
                try:
                    zone = WorkZone.objects.get(pk=work_zone_id)
                except WorkZone.DoesNotExist:
                    return Response(
                        {'detail': 'Zone de travail introuvable.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                z_lat, z_lng, z_radius = zone.latitude, zone.longitude, zone.radius_m
                if z_lat is not None and z_lng is not None and z_radius is not None:
                    try:
                        lat = float(lat_in) if lat_in is not None else None
                        lng = float(lng_in) if lng_in is not None else None
                    except (TypeError, ValueError):
                        lat = lng = None
                    if lat is not None and lng is not None:
                        dist = distance_meters(lat, lng, float(z_lat), float(z_lng))
                        if dist > float(z_radius):
                            return Response(
                                {'detail': f'Vous n\'êtes pas dans la zone (distance {int(dist)} m, rayon {z_radius} m).'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
            data_for_serializer = {k: data[k] for k in ('check_type', 'work_zone', 'note') if k in data}
            if lat_in is not None and lng_in is not None:
                try:
                    data_for_serializer['latitude'] = float(lat_in)
                    data_for_serializer['longitude'] = float(lng_in)
                except (TypeError, ValueError):
                    pass

        serializer = self.get_serializer(data=data_for_serializer)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
