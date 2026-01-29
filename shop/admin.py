from django.contrib import admin
from .models import Order

# Register your models here.
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'formatted_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    readonly_fields = ('amount', 'email', 'created_at')

    def formatted_amount(self, obj):
        return f"₦{int(obj.amount):,}"
    formatted_amount.short_description = "Amount (NGN)"
