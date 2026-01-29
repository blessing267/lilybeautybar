from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect
import stripe
from decimal import Decimal
from django.urls import reverse
from django.contrib import messages
from django.contrib.admin.views.decorators import user_passes_test

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status, viewsets

from .models import Product
from .forms import ProductForm
from .serializers import ProductSerializer


# -------------------------------
# Admin-only decorator
# -------------------------------
def admin_required(view_func):
    decorated_view_func = user_passes_test(
        lambda u: u.is_active and u.is_superuser,
        login_url='login'  # redirect to login page if not admin
    )(view_func)
    return decorated_view_func

# -------------------------------
# Protect product API
# -------------------------------
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

# -------------------------------
# Public Views (Django templates)
# -------------------------------
def home(request):
    products = Product.objects.all().order_by('-id')
    return render(request, 'shop/home.html', {'products': products})

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

    # Email (optional for guests)
    customer_email = request.user.email if request.user.is_authenticated else None

    # 🔒 Stripe minimum for NGN (≈ ₦200)
    MIN_NGN_AMOUNT = Decimal('1000')

    if product.price is None or product.price < MIN_NGN_AMOUNT:
        messages.error(
            request,
            "This product price is too low to process payment. Minimum is ₦200."
        )
        return redirect('product_detail', pk=product.id)

    unit_amount = int(product.price)  # NGN is zero-decimal → convert safely

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
                'unit_amount': unit_amount,
            },
            'quantity': 1,
        }],
        customer_email=customer_email,
        success_url=request.build_absolute_uri(
            reverse('success')
        ) + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url=request.build_absolute_uri(reverse('cancel')),
        metadata={
            'product_id': str(product.id),
            'product_name': product.name,
        },
    )

    return redirect(session.url)

def success(request):
    return render(request, 'shop/success.html')


def cancel(request):
    return render(request, 'shop/cancel.html')

# -------------------------------
# Admin Dashboard (Django template)
# -------------------------------
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

# -------------------------------
# DRF API for React Dashboard
# -------------------------------
# List all products / Add product
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def dashboard_api(request):
    if request.method == 'GET':
        products = Product.objects.all().order_by('-created_at')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ProductSerializer (
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Retrieve / Update / Delete product
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def dashboard_api_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ProductSerializer(
            product, 
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)






