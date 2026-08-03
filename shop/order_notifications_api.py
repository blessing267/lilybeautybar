from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import Order


@api_view(["GET"])
@permission_classes([IsAdminUser])
def order_notifications_api(request):
    """Return recent orders of every status for the admin notification bell."""
    orders = Order.objects.order_by("-created_at")[:30]

    return Response(
        {
            "orders": [
                {
                    "id": order.id,
                    "status": order.status,
                    "customer": order.full_name or order.email or "Customer",
                    "created_at": order.created_at.isoformat(),
                    "created_at_display": timezone.localtime(order.created_at).strftime(
                        "%d %b, %H:%M"
                    ),
                }
                for order in orders
            ]
        }
    )
