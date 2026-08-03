import json

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.db import models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from shop.models import Order
from .models import Profile

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAdminUser])
def customers_api(request):
    customers = User.objects.filter(
        is_staff=False
    ).select_related("profile").order_by("-date_joined")

    results = []

    for customer in customers:
        customer_orders = Order.objects.filter(
            user=customer
        )

        profile = getattr(customer, "profile", None)

        results.append({
            "id": customer.id,
            "full_name": customer.get_full_name() or customer.username,
            "username": customer.username,
            "email": customer.email,
            "phone": profile.phone if profile else "",
            "profile_image": (
                request.build_absolute_uri(profile.image.url)
                if profile and profile.image
                else None
            ),
            "date_joined": customer.date_joined.isoformat(),
            "order_count": customer_orders.count(),
            "total_spent": float(
                customer_orders.filter(status="paid")
                .aggregate(total=Sum("amount"))["total"] or 0
            ),
            "is_active": customer.is_active,
        })

    return Response(results)

def _payload(request, user, profile):
    return {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "email": user.email,
        "phone": profile.phone,
        "profile_image": (
            request.build_absolute_uri(
                profile.image.url
            )
            if profile.image
            else None
        ),
    }


@login_required
@require_http_methods(["GET", "POST"])
def profile_api(request):
    if not request.user.is_superuser:
        return JsonResponse(
            {"detail": "Dashboard access required."},
            status=403,
        )

    profile, _ = Profile.objects.get_or_create(
        user=request.user
    )

    if request.method == "GET":
        return JsonResponse(
            _payload(request, request.user, profile)
        )

    email = request.POST.get("email", "").strip()
    username = request.POST.get(
        "username",
        "",
    ).strip()

    if not username:
        return JsonResponse(
            {"detail": "Username is required."},
            status=400,
        )

    if email:
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse(
                {
                    "detail":
                    "Enter a valid email address."
                },
                status=400,
            )

    user = request.user
    user.first_name = request.POST.get(
        "first_name",
        "",
    ).strip()
    user.last_name = request.POST.get(
        "last_name",
        "",
    ).strip()
    user.username = username
    user.email = email
    user.save()

    profile.phone = request.POST.get(
        "phone",
        "",
    ).strip()

    if request.FILES.get("image"):
        profile.image = request.FILES["image"]

    profile.save()

    return JsonResponse(
        _payload(request, user, profile)
    )
