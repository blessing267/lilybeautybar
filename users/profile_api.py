import json

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .models import Profile


def _payload(user, profile):
    return {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "email": user.email,
        "phone": profile.phone,
    }


@login_required
@require_http_methods(["GET", "PUT"])
def profile_api(request):
    if not request.user.is_superuser:
        return JsonResponse({"detail": "Dashboard access required."}, status=403)

    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return JsonResponse(_payload(request.user, profile))

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid request."}, status=400)

    email = str(data.get("email", "")).strip()
    username = str(data.get("username", "")).strip()

    if not username:
        return JsonResponse({"detail": "Username is required."}, status=400)

    if email:
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({"detail": "Enter a valid email address."}, status=400)

    user = request.user
    user.first_name = str(data.get("first_name", "")).strip()
    user.last_name = str(data.get("last_name", "")).strip()
    user.username = username
    user.email = email
    user.save(update_fields=["first_name", "last_name", "username", "email"])

    profile.phone = str(data.get("phone", "")).strip()
    profile.save(update_fields=["phone"])

    return JsonResponse(_payload(user, profile))
