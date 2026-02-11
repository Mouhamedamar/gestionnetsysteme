from django.contrib import admin
from .models import WorkZone


@admin.register(WorkZone)
class WorkZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'zone_type', 'radius_m', 'address', 'created_at']
    list_filter = ['zone_type']
    search_fields = ['name', 'address']
