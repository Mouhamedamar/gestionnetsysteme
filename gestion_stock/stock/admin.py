from django.contrib import admin
from .models import StockMovement, StockNotificationRecipient, StockAlertSettings


@admin.register(StockNotificationRecipient)
class StockNotificationRecipientAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'phone', 'email']
    list_editable = ['is_active']


@admin.register(StockAlertSettings)
class StockAlertSettingsAdmin(admin.ModelAdmin):
    list_display = ['alert_threshold', 'reminder_interval_days', 'last_reminder_sent_at', 'updated_at']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'date', 'created_at']
    list_filter = ['movement_type', 'date', 'created_at']
    search_fields = ['product__name', 'comment']
    readonly_fields = ['created_at']
    date_hierarchy = 'date'
