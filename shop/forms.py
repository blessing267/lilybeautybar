from django import forms

class CheckoutForm(forms.Form):
    email = forms.EmailField(required=True)
    full_name = forms.CharField(required=True, max_length=255)
    phone = forms.CharField(required=False, max_length=40)
    address = forms.CharField(required=False, widget=forms.Textarea(attrs={'rows':2}))
    city = forms.CharField(required=False, max_length=100)
    create_account = forms.BooleanField(required=False, initial=False, label="Create an account after payment (optional)")
    # optional password fields if you want immediate account creation -- we will create account after successful payment instead
