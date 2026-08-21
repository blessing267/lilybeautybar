from django import forms
from django.forms import inlineformset_factory
from .models import Product, ProductVariant

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = '__all__' #['name', 'description', 'price', 'image']
        labels = {
            'price': 'Price (₦)',
        }
        help_texts = {
            'price': 'Minimum charge is ₦100. Enter amount in Naira only.',
        }

    def clean_price(self):
        price = self.cleaned_data['price']
        if price < 100:
            raise forms.ValidationError(
                "paystack requires a minimum charge of ₦100."
            )
        return price
    
class ProductVariantForm(forms.ModelForm):
    class Meta:
        model = ProductVariant
        fields = [
            'colour',
            'product_type',
            'price',
            'stock',
            'image',
        ]


ProductVariantFormSet = inlineformset_factory(
    Product,
    ProductVariant,
    form=ProductVariantForm,
    extra=1,
    can_delete=True
)