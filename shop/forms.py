from django import forms
from .models import Product

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
            'price': 'Minimum charge is ₦200. Enter amount in Naira only.',
        }

    def clean_price(self):
        price = self.cleaned_data['price']
        if price < 200:
            raise forms.ValidationError(
                "Stripe requires a minimum charge of ₦200."
            )
        return price