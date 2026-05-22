from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect

from paystackapi.transaction import Transaction
from paystackapi.paystack import Paystack

from decimal import Decimal
from django.db.models import F
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

# -------------------------------
# Cart
# -------------------------------
def add_to_cart(request, product_id):
    if request.method == "POST":

        product = get_object_or_404(
            Product,
            id=product_id
        )

        variant_id = request.POST.get(
            "variant_id"
        )

        quantity = int(
            request.POST.get(
                "quantity",
                1
            )
        )

        # Variant is OPTIONAL
        variant = None

        if variant_id:
            variant = get_object_or_404(
                ProductVariant,
                id=variant_id
            )

        cart = request.session.get(
            "cart",
            {}
        )

        # Create unique cart key
        cart_key = (
            f"{product.id}-{variant.id}"
            if variant
            else str(product.id)
        )

        if cart_key in cart:
            cart[cart_key][
                "quantity"
            ] += quantity
        else:
            cart[cart_key] = {
                "product_id":
                    product.id,
                "variant_id":
                    variant.id
                    if variant
                    else None,
                "quantity":
                    quantity
            }

        request.session["cart"] = cart
        request.session.modified = True

        messages.success(
            request,
            "Added to cart!"
        )

        return redirect("cart")

    return redirect("home")

def cart(request):

    cart = request.session.get(
        "cart",
        {}
    )

    cart_items = []

    total = Decimal(
        "0.00"
    )

    for key, item in cart.items():

        product = Product.objects.filter(
            id=item[
                "product_id"
            ]
        ).first()

        if not product:
            continue

        variant = None

        if item[
            "variant_id"
        ]:
            variant = (
                ProductVariant.objects
                .filter(
                    id=item[
                        "variant_id"
                    ]
                )
                .first()
            )

        quantity = item[
            "quantity"
        ]

        price = (
            variant.price
            if (
                variant
                and variant.price
            )
            else product.price
        )

        subtotal = (
            price *
            quantity
        )

        total += subtotal

        cart_items.append({
            "key": key,
            "product": product,
            "variant": variant,
            "quantity": quantity,
            "price": price,
            "subtotal": subtotal
        })

    return render(
        request,
        "shop/cart.html",
        {
            "cart_items":
                cart_items,
            "total":
                total
        }
    )

def remove_from_cart(
    request,
    cart_key
):
    cart = request.session.get(
        "cart",
        {}
    )

    if cart_key in cart:
        del cart[cart_key]

    request.session[
        "cart"
    ] = cart

    request.session.modified = True

    messages.success(
        request,
        "Item removed."
    )

    return redirect("cart")

def update_cart(
    request,
    cart_key
):
    if request.method == "POST":

        quantity = int(
            request.POST.get(
                "quantity",
                1
            )
        )

        cart = request.session.get(
            "cart",
            {}
        )

        if cart_key in cart:

            if quantity > 0:
                cart[cart_key][
                    "quantity"
                ] = quantity
            else:
                del cart[cart_key]

        request.session[
            "cart"
        ] = cart

        request.session.modified = True

    return redirect("cart")

@login_required
def orders(request):
    payments = Payment.objects.filter(
        verified=True,
        email=request.user.email
    ).order_by('-created_at')

    return render(request, 'shop/orders.html', {'payments': payments})

# -------------------------------
# Payment Method
# -------------------------------
paystack = Paystack(secret_key=settings.PAYSTACK_SECRET_KEY)

def checkout(request):

    cart = request.session.get(
        "cart",
        {}
    )

    if not cart:
        messages.error(
            request,
            "Your cart is empty."
        )

        return redirect(
            "products"
        )

    # -------------------------
    # Build cart summary
    # -------------------------
    cart_items = []

    total_amount = Decimal(
        "0.00"
    )

    for key, item in cart.items():

        product = Product.objects.filter(
            id=item[
                "product_id"
            ]
        ).first()

        if not product:
            continue

        variant = None

        if item[
            "variant_id"
        ]:

            variant = (
                ProductVariant.objects
                .filter(
                    id=item[
                        "variant_id"
                    ]
                )
                .first()
            )

        quantity = item[
            "quantity"
        ]

        price = (
            variant.price
            if (
                variant
                and variant.price
            )
            else product.price
        )

        subtotal = (
            price *
            quantity
        )

        total_amount += subtotal

        cart_items.append({
            "product":
                product,

            "variant":
                variant,

            "quantity":
                quantity,

            "price":
                price,

            "subtotal":
                subtotal
        })

    # -------------------------
    # Payment processing
    # -------------------------
    if request.method == "POST":

        customer_email = (
            request.user.email
            if request.user.is_authenticated
            else request.POST.get(
                "email"
            )
        )

        if not customer_email:

            messages.error(
                request,
                "Email is required."
            )

            return redirect(
                "checkout"
            )

        # Create Order
        order = Order.objects.create(
            user=(
                request.user
                if request.user.is_authenticated
                else None
            ),

            email=
                customer_email,

            status=
                "pending",

            amount=
                total_amount
        )

        # Save OrderItems
        for item in cart_items:

            OrderItem.objects.create(
                order=order,

                product=
                    item[
                        "product"
                    ],

                variant=
                    item[
                        "variant"
                    ],

                quantity=
                    item[
                        "quantity"
                    ],

                unit_price=
                    item[
                        "price"
                    ]
            )

        amount_kobo = int(
            total_amount * 100
        )

        response = (
            Transaction.initialize(
                email=
                    customer_email,

                amount=
                    amount_kobo,

                callback_url=(
                    settings
                    .PAYSTACK_CALLBACK_URL
                ),

                metadata={
                    "order_id":
                        order.id
                }
            )
        )

        if response[
            "status"
        ]:

            return redirect(
                response[
                    "data"
                ][
                    "authorization_url"
                ]
            )

        messages.error(
            request,
            "Payment failed."
        )

    return render(
        request,
        "shop/checkout.html",
        {
            "cart_items":
                cart_items,

            "total":
                total_amount
        }
    )

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

        # SAFE amount conversion
        amount = Decimal(str(data.get("amount", 0))) / Decimal("100")

        # Mark order paid
        order.status = "paid"
        order.amount = amount
        order.save()

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






