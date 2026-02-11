import django_filters
from .models import CheckIn


class CheckInFilter(django_filters.FilterSet):
    """Filtres pour les pointages (admin)."""
    user = django_filters.NumberFilter(field_name='user__id', lookup_expr='exact')
    username = django_filters.CharFilter(field_name='user__username', lookup_expr='icontains')
    work_zone = django_filters.NumberFilter(field_name='work_zone__id', lookup_expr='exact')
    check_type = django_filters.ChoiceFilter(choices=CheckIn.TYPE_CHOICES)
    date_after = django_filters.DateFilter(field_name='timestamp', lookup_expr='date__gte')
    date_before = django_filters.DateFilter(field_name='timestamp', lookup_expr='date__lte')

    class Meta:
        model = CheckIn
        fields = ['user', 'work_zone', 'check_type']
