from django.contrib import admin
from .models import Installation, InstallationProduct


@admin.register(Installation)
class InstallationAdmin(admin.ModelAdmin):
    list_display = [
        'installation_number',
        'title',
        'client_name',
        'technician',
        'installation_type',
        'status',
        'scheduled_date',
        'created_at'
    ]
    list_filter = ['status', 'installation_type', 'created_at', 'technician']
    search_fields = ['installation_number', 'title', 'client_name', 'description']
    readonly_fields = ['installation_number', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


@admin.register(InstallationProduct)
class InstallationProductAdmin(admin.ModelAdmin):
    list_display = ['installation', 'product', 'quantity', 'serial_number', 'created_at']
    list_filter = ['created_at']
    search_fields = ['installation__installation_number', 'product__name', 'serial_number']
    readonly_fields = ['created_at']
