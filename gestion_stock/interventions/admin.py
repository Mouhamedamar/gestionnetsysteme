from django.contrib import admin
from .models import Intervention, InterventionProduct


@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = ['intervention_number', 'title', 'client_name', 'technician', 'status', 'priority', 'scheduled_date', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['intervention_number', 'title', 'client_name']
    readonly_fields = ['intervention_number', 'created_at', 'updated_at']
    fieldsets = (
        ('Informations générales', {
            'fields': ('intervention_number', 'title', 'description')
        }),
        ('Client', {
            'fields': ('client', 'client_name', 'client_phone', 'client_address')
        }),
        ('Assignation', {
            'fields': ('technician', 'status', 'priority')
        }),
        ('Dates', {
            'fields': ('scheduled_date', 'start_date', 'end_date')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at', 'deleted_at')
        }),
    )


@admin.register(InterventionProduct)
class InterventionProductAdmin(admin.ModelAdmin):
    list_display = ['intervention', 'product', 'quantity', 'created_at']
    list_filter = ['created_at']
    search_fields = ['intervention__intervention_number', 'product__name']
