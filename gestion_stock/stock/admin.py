from django.contrib import admin
from .models import StockMovement


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'date', 'created_at']
    list_filter = ['movement_type', 'date', 'created_at']
    search_fields = ['product__name', 'comment']
    readonly_fields = ['created_at']
    date_hierarchy = 'date'
