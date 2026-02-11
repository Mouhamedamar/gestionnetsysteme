from django.contrib import admin
from .models import CheckIn


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ('user', 'check_type', 'timestamp', 'note')
    list_filter = ('check_type', 'timestamp')
    search_fields = ('user__username', 'note')
    readonly_fields = ('timestamp',)
