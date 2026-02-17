from django.contrib import admin
from .models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = ['subtotal']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client_name', 'total_ttc', 'is_cancelled', 'date']
    list_filter = ['is_cancelled', 'date']
    search_fields = ['invoice_number', 'client_name']
    readonly_fields = ['invoice_number', 'total_ht', 'total_ttc', 'created_at', 'updated_at']
    inlines = [InvoiceItemInline]
    date_hierarchy = 'date'


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'product', 'quantity', 'unit_price', 'subtotal']
    list_filter = ['invoice__date']
    search_fields = ['invoice__invoice_number', 'product__name']
    readonly_fields = ['subtotal']
