from django.conf import settings
from django.shortcuts import render, redirect
import stripe
from django.http import HttpResponse

# Create your views here.

def home(request):
    return render(request, 'shop/home.html')

def checkout(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY

    # Default email = logged in user’s email
    user_email = request.user.email if request.user.is_authenticated else None

    if request.method == "POST":
        # If user isn’t logged in, get email from form
        if not user_email:
            user_email = request.POST.get('email')

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'ngn',
                        'product_data': {
                            'name': 'Lily Beauty Bar Service',
                        },
                        'unit_amount': 100000,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                customer_email=user_email,
                success_url=request.build_absolute_uri('/success/'),
                cancel_url=request.build_absolute_uri('/cancel/'),
                shipping_address_collection={
                    'allowed_countries': ['NG'],
                },
            )
        except Exception as e:
            # This will show the actual Stripe error
            return HttpResponse(f"Stripe error: {e}")

        return redirect(session.url)

    return render(request, 'shop/checkout.html', {"user_email": user_email})

def success(request):
    return render(request, 'shop/success.html')


def cancel(request):
    return render(request, 'shop/cancel.html')
