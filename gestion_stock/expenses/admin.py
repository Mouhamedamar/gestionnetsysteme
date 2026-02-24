from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'site', 'category', 'amount', 'status', 'date', 'deleted_at']
    list_filter = ['site', 'category', 'status', 'date', 'deleted_at']
    search_fields = ['title', 'description', 'supplier', 'receipt_number']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
