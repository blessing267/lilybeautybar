from django import forms
from django.forms import inlineformset_factory
from .models import Product, ProductVariant

class CheckoutForm(forms.Form):
    email = forms.EmailField(required=True)
    full_name = forms.CharField(required=True, max_length=255)
    phone = forms.CharField(required=False, max_length=40)
    address = forms.CharField(required=False, widget=forms.Textarea(attrs={'rows':2}))
    city = forms.CharField(required=False, max_length=100)
    create_account = forms.BooleanField(required=False, initial=False, label="Create an account after payment (optional)")
    # optional password fields if you want immediate account creation -- we will create account after successful payment instead

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