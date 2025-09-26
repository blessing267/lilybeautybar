from django.conf import settings
from django.shortcuts import render, redirect
import stripe
from .models import Order

# Create your views here.

def home(request):
    return render(request, 'shop/home.html')

def checkout(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY

    if request.method == "POST":
        # Guest email or logged-in user email
        email = request.POST.get("email") if not request.user.is_authenticated else request.user.email

        # Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=email,
            line_items=[{
                'price_data': {
                    'currency': 'ngn',
                    'product_data': {'name': 'Lily Beauty Bar Service',},
                    'unit_amount': 100000,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.build_absolute_uri('/success/'),
            cancel_url=request.build_absolute_uri('/cancel/'),
        )

        # Save order in backend
        Order.objects.create(
            user=request.user if request.user.is_authenticated else None,
            email=email,
            amount=1000,
            status="pending"
        )

        return redirect(session.url)

    return render(request, 'shop/checkout.html')

def success(request):
    return render(request, 'shop/success.html')


def cancel(request):
    return render(request, 'shop/cancel.html')
