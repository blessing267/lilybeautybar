from calendar import monthrange
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDate, TruncHour, TruncMonth
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import Order, OrderItem, Product

User = get_user_model()
VALID_PERIODS = {"daily", "weekly", "monthly", "yearly"}


def percentage_change(current, previous):
    current = float(current or 0)
    previous = float(previous or 0)
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100, 1)


def period_bounds(now, period):
    if period == "daily":
        current_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        previous_start = current_start - timedelta(days=1)
        previous_end = current_start
    elif period == "weekly":
        current_start = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        previous_start = current_start - timedelta(days=7)
        previous_end = current_start
    elif period == "yearly":
        current_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_start = current_start.replace(year=current_start.year - 1)
        previous_end = current_start
    else:
        current_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if current_start.month == 1:
            previous_start = current_start.replace(year=current_start.year - 1, month=12)
        else:
            previous_start = current_start.replace(month=current_start.month - 1)
        previous_end = current_start

    return current_start, previous_start, previous_end


def build_sales_chart(current_paid, now, period):
    if period == "daily":
        grouped = {
            timezone.localtime(row["point"]).hour: row["total"] or 0
            for row in current_paid.annotate(point=TruncHour("created_at"))
            .values("point")
            .annotate(total=Sum("amount"))
            .order_by("point")
        }
        return [
            {
                "key": str(hour),
                "label": f"{hour:02d}:00",
                "total": float(grouped.get(hour, 0)),
            }
            for hour in range(0, now.hour + 1)
        ]

    if period == "weekly":
        start = (now - timedelta(days=now.weekday())).date()
        grouped = {
            row["point"]: row["total"] or 0
            for row in current_paid.annotate(point=TruncDate("created_at"))
            .values("point")
            .annotate(total=Sum("amount"))
            .order_by("point")
        }
        return [
            {
                "key": day.isoformat(),
                "label": day.strftime("%a"),
                "total": float(grouped.get(day, 0)),
            }
            for day in (start + timedelta(days=index) for index in range(7))
        ]

    if period == "yearly":
        grouped = {
            timezone.localtime(row["point"]).month: row["total"] or 0
            for row in current_paid.annotate(point=TruncMonth("created_at"))
            .values("point")
            .annotate(total=Sum("amount"))
            .order_by("point")
        }
        return [
            {
                "key": str(month),
                "label": datetime(now.year, month, 1).strftime("%b"),
                "total": float(grouped.get(month, 0)),
            }
            for month in range(1, 13)
        ]

    grouped = {
        row["point"]: row["total"] or 0
        for row in current_paid.annotate(point=TruncDate("created_at"))
        .values("point")
        .annotate(total=Sum("amount"))
        .order_by("point")
    }
    days = monthrange(now.year, now.month)[1]
    return [
        {
            "key": str(day_number),
            "label": str(day_number),
            "total": float(
                grouped.get(datetime(now.year, now.month, day_number).date(), 0)
            ),
        }
        for day_number in range(1, days + 1)
    ]


def product_performance():
    revenue_expression = ExpressionWrapper(
        F("quantity") * F("unit_price"),
        output_field=DecimalField(max_digits=14, decimal_places=2),
    )
    sold_rows = OrderItem.objects.filter(order__status="paid").values("product_id").annotate(
        sold_quantity=Sum("quantity"),
        sales_revenue=Sum(revenue_expression),
    )
    sales_map = {row["product_id"]: row for row in sold_rows}

    results = []
    for product in Product.objects.all().order_by("-created_at"):
        metrics = sales_map.get(product.id, {})
        image_url = product.image.url if product.image else ""
        results.append(
            {
                "id": product.id,
                "name": product.name,
                "stock": product.stock,
                "price": float(product.current_price),
                "image_url": image_url,
                "sold_quantity": int(metrics.get("sold_quantity") or 0),
                "sales_revenue": float(metrics.get("sales_revenue") or 0),
            }
        )
    return results


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_stats_api(request):
    period = request.query_params.get("period", "monthly").lower()
    if period not in VALID_PERIODS:
        period = "monthly"

    now = timezone.localtime()
    current_start, previous_start, previous_end = period_bounds(now, period)

    paid_orders = Order.objects.filter(status="paid")
    current_paid = paid_orders.filter(created_at__gte=current_start)
    previous_paid = paid_orders.filter(
        created_at__gte=previous_start,
        created_at__lt=previous_end,
    )

    current_sales = current_paid.aggregate(total=Sum("amount"))["total"] or 0
    previous_sales = previous_paid.aggregate(total=Sum("amount"))["total"] or 0
    current_orders = Order.objects.filter(created_at__gte=current_start).count()
    previous_orders = Order.objects.filter(
        created_at__gte=previous_start,
        created_at__lt=previous_end,
    ).count()

    recent_orders = [
        {
            "id": order.id,
            "date": timezone.localtime(order.created_at).strftime("%d %b %Y"),
            "amount": float(order.amount or order.get_total()),
            "status": order.status,
            "customer": order.full_name or order.email,
        }
        for order in Order.objects.prefetch_related("items").order_by("-created_at")[:5]
    ]

    return Response(
        {
            "period": period,
            "summary": {
                "total_sales": float(paid_orders.aggregate(total=Sum("amount"))["total"] or 0),
                "period_sales": float(current_sales),
                "period_sales_change": percentage_change(current_sales, previous_sales),
                "total_orders": Order.objects.count(),
                "period_orders_change": percentage_change(current_orders, previous_orders),
                "total_customers": User.objects.filter(is_staff=False, is_active=True).count(),
                "total_products": Product.objects.count(),
                "pending_orders": Order.objects.filter(status="pending").count(),
            },
            "sales_chart": build_sales_chart(current_paid, now, period),
            "recent_orders": recent_orders,
            "product_performance": product_performance(),
        }
    )
