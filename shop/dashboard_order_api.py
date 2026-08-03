from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Order


def serialize_order(order):
    return {
        "id": order.id,
        "email": order.email,
        "full_name": order.full_name,
        "phone": order.phone,
        "order_note": order.order_note,
        "amount": str(order.amount or order.get_total()),
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "item_count": sum(item.quantity for item in order.items.all()),
        "items": [
            {
                "id": item.id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "variant": (
                    item.variant.colour
                    or item.variant.product_type
                    or item.variant.sku
                    if item.variant else None
                ),
            }
            for item in order.items.all()
        ],
    }


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_orders_api(request):
    orders = (
        Order.objects
        .prefetch_related("items__product", "items__variant")
        .order_by("-created_at")
    )
    return Response([serialize_order(order) for order in orders])


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def admin_order_detail_api(request, pk):
    order = get_object_or_404(
        Order.objects.prefetch_related("items__product", "items__variant"),
        pk=pk,
    )
    new_status = request.data.get("status")
    valid_statuses = {choice[0] for choice in Order.STATUS_CHOICES}
    if new_status not in valid_statuses:
        return Response(
            {"status": "Choose pending, paid, or cancelled."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    order.status = new_status
    order.save(update_fields=["status"])
    return Response(serialize_order(order))
