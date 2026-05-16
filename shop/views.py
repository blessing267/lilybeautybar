from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect

from paystackapi.transaction import Transaction
from paystackapi.paystack import Paystack

from decimal import Decimal
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status, viewsets

from .models import Product, ProductVariant, Payment, Order, OrderItem
from .forms import ProductForm, ProductVariantFormSet
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
    product_list = Product.objects.all().order_by('-id')

    paginator = Paginator(product_list, 12)  # Show 12 products per page

    page_number = request.GET.get('page')
    products = paginator.get_page(page_number)

    return render(request, 'shop/products.html', {'products': products})

def product_detail(request, pk):
    product = get_object_or_404(Product, pk=pk)

    variant_id = request.GET.get("variant")
    selected_variant = None

    if variant_id:
        selected_variant = product.variants.filter(id=variant_id).first()

    has_paid = False
    if request.user.is_authenticated and selected_variant:
        has_paid = Payment.objects.filter(
            order__items__variant=selected_variant,
            user=request.user,
            verified=True
        ).exists()

    return render(request, 'shop/product_detail.html', { 
        'product': product,
        'selected_variant': selected_variant,
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

    variant_id = request.POST.get("variant_id")
    variant = get_object_or_404(ProductVariant, id=variant_id)

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
    if request.user.is_authenticated:
        existing_payment = Order.objects.filter(
            user=request.user,
            status="paid",
            items__variant=variant
        ).exists()
    else:
        existing_payment = Order.objects.filter(
            email=customer_email,
            status="paid",
            items__variant=variant
        ).exists()

    if existing_payment:
        messages.warning(request, "You have already purchased this product.")
        return redirect('product_detail', pk=product.id)

    # Create Order
    order = Order.objects.create(
        user=request.user if request.user.is_authenticated else None,
        email=customer_email,
        amount=product.price,
    )

    # Create OrderItem
    OrderItem.objects.create(
        order=order,
        product=product,
        variant=variant,
        quantity=1,
        unit_price=variant.price or product.price
    )

    # Initialize Paystack transaction
    response = Transaction.initialize(
        email=customer_email,
        amount=amount_kobo,
        callback_url=settings.PAYSTACK_CALLBACK_URL,
        metadata={
            "order_id": order.id
        }
    )

    if response['status']:
        # Redirect to Paystack payment page
        return redirect(response['data']['authorization_url'])
    else:
        messages.error(request, "Error initializing payment. Please try again.")
        return redirect('product_detail', pk=product.id)


def success(request):
    reference = request.GET.get('reference')

    if not reference:
        messages.error(request, "No payment reference provided.")
        return redirect('home')

    try:
        response = Transaction.verify(reference=reference)

        if not response:
            messages.error(request, "Empty response from Paystack.")
            return redirect('home')

        if not response.get('status'):
            messages.error(request, "Payment verification failed.")
            return redirect('home')

        data = response.get('data', {})

        if data.get('status') != 'success':
            messages.error(request, "Payment not successful.")
            return redirect('home')

        # SAFE metadata handling
        metadata = data.get('metadata') or {}
        order_id = metadata.get("order_id")

        if not order_id:
            messages.error(request, "Order ID missing from payment.")
            return redirect('home')

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            messages.error(request, "Order not found.")
            return redirect('home')

        # Mark order paid
        order.status = "paid"
        order.amount = amount
        order.save()

        # SAFE amount conversion
        amount = Decimal(str(data.get("amount", 0))) / Decimal("100")

        # Create or update payment
        payment, created = Payment.objects.update_or_create(
            reference=reference,
            defaults={
                "user": order.user,
                "email": order.email,
                "amount": amount,
                "order": order,
                "verified": True
            }
        )

        return render(request, 'shop/success.html', {
            "payment": payment,
            "order": order
        })

    except Exception as e:
        messages.error(request, "Something went wrong while verifying payment.")
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
        secret = settings.PAYSTACK_SECRET_KEY.encode()
        hash_signature = hmac.new(secret, payload, hashlib.sha512).hexdigest()

        if hash_signature != signature:
            return JsonResponse({'status': 'invalid signature'}, status=400)

        event = json.loads(payload)

        # Handle successful payment
        if event['event'] == 'charge.success':
            data = event['data']

            reference = data['reference']
            email = data['customer']['email']
            amount = Decimal(str(data['amount'])) / Decimal("100")


            metadata = data.get("metadata", {})
            order_id = metadata.get("order_id")

            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return JsonResponse({'status': 'order not found'}, status=400)

            order.status = "paid"
            order.amount = amount
            order.save()

            Payment.objects.update_or_create(
                reference=reference,
                defaults={
                    "order": order,
                    "email": email,
                    "amount": amount,
                    "verified": True
                }
            )

        return JsonResponse({'status': 'success'})

    return JsonResponse({'status': 'invalid method'}, status=405)

def add_product(request):
    if request.method == "POST":
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save()

            formset = ProductVariantFormSet(
                request.POST,
                request.FILES,
                instance=product
            )

            if formset.is_valid():
                formset.save()

            return redirect('dashboard')
    else:
        form = ProductForm()
        formset = ProductVariantFormSet()

    return render(request, 'shop/dashboard/product_form.html', {'form': form, 'formset': formset, 'product': None})

def edit_product(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == "POST":
        form = ProductForm(request.POST, request.FILES, instance=product)
        
        formset = ProductVariantFormSet(
            request.POST,
            request.FILES,
            instance=product
        )

        if (
            form.is_valid()
            and formset.is_valid()
        ):
            form.save()
            formset.save()

            return redirect('dashboard')
    else:
        form = ProductForm(instance=product)
        formset = ProductVariantFormSet(
            instance=product
        )
    return render(request, 'shop/dashboard/product_form.html', {'form': form, 'formset': formset, 'product': product})

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






