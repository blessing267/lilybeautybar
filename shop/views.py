from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect
import stripe
from .models import Product
from django.urls import reverse

# Create your views here.

def home(request):
    products = Product.objects.all().order_by('-id')
    return render(request, 'shop/home.html')

def product_list(request):
    products = Product.objects.all()
    return render(request, 'shop/product_list.html', {'products': products})

def product_detail(request, pk):
    product = get_object_or_404(Product, pk=pk)
    return render(request, 'shop/product_detail.html', { 'product': product })

def checkout(request, product_id):
    if request.method != "POST":
        return redirect('product_detail', pk=product_id)
    
    product = get_object_or_404(Product, pk=product_id)
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    # HYBRID EMAIL STRATEGY
    customer_email = request.user.email if request.user.is_authenticated else None

    # Stripe requires NGN amounts in KOBO (price * 100)
    amount_kobo = int(product.price * 100)

    # Stripe checkout session
    session = stripe.checkout.Session.create(
        mode='payment',
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': 'ngn',
                'product_data': {
                    'name': product.name,
                    'description': (product.description or '')[:200],
                },
                'unit_amount': amount_kobo,
            },
            'quantity': 1,
        }],
        customer_email=customer_email,
        success_url=request.build_absolute_uri(reverse('success')) + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url=request.build_absolute_uri(reverse('cancel')),
        metadata={'product_id': str(product.id)},
    )

    return redirect(session.url)

def success(request):
    return render(request, 'shop/success.html')


def cancel(request):
    return render(request, 'shop/cancel.html')
