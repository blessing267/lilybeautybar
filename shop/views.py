from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect
import stripe
from .models import Product
from .forms import ProductForm
from django.urls import reverse
from django.contrib.admin.views.decorators import user_passes_test


# Create your views here.

# Only allow superusers to access
def admin_required(view_func):
    decorated_view_func = user_passes_test(
        lambda u: u.is_active and u.is_superuser,
        login_url='login'  # redirect to login page if not admin
    )(view_func)
    return decorated_view_func

def home(request):
    products = Product.objects.all().order_by('-id')
    return render(request, 'shop/home.html', {'products': products})

def product_list(request):
    products = Product.objects.all()
    return render(request, 'shop/product_list.html', {'products': products})

def product_detail(request, pk):
    product = get_object_or_404(Product, pk=pk)
    return render(request, 'shop/product_detail.html', { 'product': product })

@admin_required
def dashboard(request):
    products = Product.objects.all().order_by('-created_at')
    
    # Handle deletion inline
    if request.method == "POST" and 'delete_product_id' in request.POST:
        product = get_object_or_404(Product, pk=request.POST['delete_product_id'])
        product.delete()
        return redirect('dashboard')

    return render(request, 'shop/dashboard/dashboard_home.html', {'products': products})

@admin_required
def add_product(request):
    if request.method == "POST":
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('dashboard')
    else:
        form = ProductForm()
    return render(request, 'shop/dashboard/product_form.html', {'form': form, 'product': None})

@admin_required
def edit_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == "POST":
        form = ProductForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            form.save()
            return redirect('dashboard')
    else:
        form = ProductForm(instance=product)
    return render(request, 'shop/dashboard/product_form.html', {'form': form, 'product': product})

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
