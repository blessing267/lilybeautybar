from django.conf import settings
from django.shortcuts import render, redirect
import stripe

# Create your views here.
def home(request):
    return render(request, 'shop/home.html')

def checkout(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY
    if request.method == "POST":
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'ngn',
                    'product_data': {
                        'name': 'Lily Beauty Bar Service',
                    },
                    'unit_amount': 100000,  # ₦1000
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.build_absolute_uri('/success/'),
            cancel_url=request.build_absolute_uri('/cancel/'),
        )
        return redirect(session.url)
    return render(request, 'shop/checkout.html')


def success(request):
    return render(request, 'shop/success.html')


def cancel(request):
    return render(request, 'shop/cancel.html')
