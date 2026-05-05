from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect

from paystackapi.transaction import Transaction
from paystackapi.paystack import Paystack

from decimal import Decimal
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status, viewsets

from .models import Product, Payment
from .forms import ProductForm
from .serializers import ProductSerializer

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import hmac
import hashlib
import json

# -------------------------------
# Dashboard
# -------------------------------
def dashboard(request):
    return render(request, "shop/dashboard/index.html")

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

def contact(request):
    return render(request, 'shop/contact.html')

def product(request):
    products = Product.objects.all()
    return render(request, 'shop/products.html', {'products': products})

def product_list(request):
    products = Product.objects.all()
    return render(request, 'shop/product_list.html', {'products': products})

def product_detail(request, pk):
    product = get_object_or_404(Product, pk=pk)

    has_paid = False
    if request.user.is_authenticated:
        has_paid = Payment.objects.filter(
            product=product,
            user=request.user,
            verified=True
        ).exists()

    return render(request, 'shop/product_detail.html', { 
        'product': product,
        'has_paid': has_paid
     })

@login_required
def orders(request):
    payments = Payment.objects.filter(
        user=request.user,
        verified=True
    ).order_by('-created_at')

    return render(request, 'shop/orders.html', {'payments': payments})

# -------------------------------
# Payment Method
# -------------------------------
paystack = Paystack(secret_key=settings.PAYSTACK_SECRET_KEY)

def checkout(request, product_id):
    if request.method != "POST":
        return redirect('product_detail', pk=product_id)

    product = get_object_or_404(Product, pk=product_id)

    # Email (required for Paystack)
    customer_email = request.user.email if request.user.is_authenticated else request.POST.get('email')
    if not customer_email:
        messages.error(request, "Email is required for payment.")
        return redirect('product_detail', pk=product_id)

    # 🔒 Paystack minimum for NGN (≈ ₦200)
    MIN_NGN_AMOUNT = Decimal('100')
    if product.price < MIN_NGN_AMOUNT:
        messages.error(request, "This product price is too low to process payment. Minimum is ₦100.")
        return redirect('product_detail', pk=product.id)

    # Convert to kobo
    amount_kobo = int(product.price * 100)

    #Prevent duplicate payment
    existing_payment = Payment.objects.filter(
        product=product,
        email=customer_email,
        verified=True
    ).first()

    if existing_payment:
        messages.warning(request, "You have already purchased this product.")
        return redirect('product_detail', pk=product.id)

    # Initialize Paystack transaction
    response = Transaction.initialize(
        email=customer_email,
        amount=amount_kobo,
        callback_url=settings.PAYSTACK_CALLBACK_URL,
        metadata={
            "product_id": str(product.id),
            "product_name": product.name
        }
    )

    if response['status']:
        # Redirect to Paystack payment page
        return redirect(response['data']['authorization_url'])
    else:
        messages.error(request, "Error initializing payment. Please try again.")
        return redirect('product_detail', pk=product.id)


def success(request):
    reference = request.GET.get('reference')  # Paystack sends ?reference=xxxx
    if not reference:
        messages.error(request, "No payment reference provided.")
        return redirect('home')

    response = Transaction.verify(reference=reference)

    if response['status'] and response['data']['status'] == 'success': # Payment successful

        metadata = response['data']['metadata']
        email = response['data']['customer']['email']
        amount = response['data']['amount'] / 100

        Payment.objects.get_or_create(
            reference=reference,
            defaults={
                "user": request.user if request.user.is_authenticated else None,
                "email": email,
                "amount": amount,
                "product_id": metadata.get("product_id"),
                "verified": True
            }
        )

        return render(request, 'shop/success.html')
    else:
        messages.error(request, "Payment could not be verified. Please contact support.")
        return redirect('home')
    
# -------------------------------
# Paystack Webhook
# -------------------------------
@csrf_exempt
def paystack_webhook(request):
    if request.method == "POST":
        payload = request.body
        signature = request.headers.get('x-paystack-signature')

        # Verify Paystack signature
        secret = settings.PAYSTACK_SECRET_KEY.encode('utf-8')
        hash_signature = hmac.new(secret, payload, hashlib.sha512).hexdigest()

        if hash_signature != signature:
            return JsonResponse({'status': 'invalid signature'}, status=400)

        event = json.loads(payload)

        # Handle successful payment
        if event['event'] == 'charge.success':
            data = event['data']

            reference = data['reference']
            email = data['customer']['email']
            amount = data['amount'] / 100

            metadata = data.get("metadata", {})
            product_id = metadata.get("product_id")

            Payment.objects.update_or_create(
                reference=reference,
                defaults={
                    "email": email,
                    "amount": amount,
                    "product_id": product_id,
                    "verified": True
                }
            )

        return JsonResponse({'status': 'success'})

    return JsonResponse({'status': 'invalid method'}, status=405)

def add_product(request):
    if request.method == "POST":
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('dashboard')
    else:
        form = ProductForm()
    return render(request, 'shop/dashboard/product_form.html', {'form': form, 'product': None})

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






