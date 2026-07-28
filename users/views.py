import json
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import UserRegisterForm, UserUpdateForm
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

# Create your views here.
def register(request):
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, f'Account created for {user.username}. You can now log in.')
            return redirect('login')
    else:
        form = UserRegisterForm()
    return render(request, 'users/register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)

            next_url = request.POST.get("next")

            messages.success(request, f'Welcome, {user.username}!')
            return redirect(next_url if next_url else 'home')
        else:
            messages.error(request, 'Invalid username or password')
    return render(request, 'users/login.html')

def logout_view(request):
    logout(request)
    messages.success(request, 'You have been logged out.')
    return redirect('login')

@login_required
def profile(request):
    if request.method == 'POST':
        form = UserUpdateForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your profile has been updated!')
            return redirect('profile')
    else:
        form = UserUpdateForm(instance=request.user)
    return render(request, 'users/profile.html', {'form': form})

@ensure_csrf_cookie
@require_http_methods(["GET"])
def session_status(request):
    has_dashboard_access = (
        request.user.is_authenticated
        and request.user.is_superuser
    )

    return JsonResponse({
        "authenticated": has_dashboard_access,
        "username": (
            request.user.username
            if has_dashboard_access
            else None
        ),
    })


@require_http_methods(["POST"])
def session_login(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid request."}, status=400)

    user = authenticate(
        request,
        username=data.get("username"),
        password=data.get("password"),
    )

    if user is None:
        return JsonResponse(
            {"detail": "Invalid username or password."},
            status=400,
        )

    if not user.is_superuser:
        return JsonResponse(
            {"detail": "You do not have dashboard access."},
            status=403,
        )

    login(request, user)

    return JsonResponse({
        "authenticated": True,
        "username": user.username,
    })


@require_http_methods(["POST"])
def session_logout(request):
    logout(request)
    return JsonResponse({"detail": "Logged out successfully."})