from django.contrib import admin
from .models import Order, Product, ProductVariant, Category, SubCategory

# Register your models here.
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'formatted_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    readonly_fields = ('amount', 'email', 'created_at')

    def formatted_amount(self, obj):
        return f"₦{int(obj.amount):,}"
    formatted_amount.short_description = "Amount (NGN)"

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

    readonly_fields = ('sku',)

    fields = (
        'sku',
        'colour',
        'product_type',
        'price',
        'stock',
        'image'
    )

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock', 'stock_status',)
    inlines = [ProductVariantInline]
    list_filter = ('category', 'subcategory',)
    search_fields = ('name',)
    inlines = [ProductVariantInline]

    def stock_status(self, obj):
        if obj.stock == 0:
            return "Out of stock"

        if obj.stock <= 3:
            return f"Low stock — {obj.stock} left"

        return "In stock"

    stock_status.short_description = "Stock status"
    
@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        'product',
        'sku',
        'colour',
        'product_type',
        'price',
        'stock'
    )

    readonly_fields = ('sku',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category")
    list_filter = ("category",)