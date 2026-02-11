from django.contrib import admin
from .models import Quote, QuoteItem


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['quote_number', 'client_name', 'date', 'expiration_date', 'status', 'total_ttc', 'created_at']
    list_filter = ['status', 'date', 'expiration_date']
    search_fields = ['quote_number', 'client_name', 'client_email']
    readonly_fields = ['quote_number', 'created_at', 'updated_at']
    date_hierarchy = 'date'


@admin.register(QuoteItem)
class QuoteItemAdmin(admin.ModelAdmin):
    list_display = ['quote', 'product', 'quantity', 'unit_price', 'subtotal']
    list_filter = ['quote__status', 'created_at']
    search_fields = ['quote__quote_number', 'product__name']
