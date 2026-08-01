from django.contrib.auth import views as auth_views
from django.urls import path, reverse_lazy
from . import views
from users import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
    path("session/status/", views.session_status, name="session-status"),
    path("session/login/", views.session_login, name="session-login"),
    path("session/logout/", views.session_logout, name="session-logout"),
    path("password-change/", auth_views.PasswordChangeView.as_view(template_name="users/password_change.html", success_url=reverse_lazy("password_change_done"), ), name="password_change",),
    path("password-change/done/", auth_views.PasswordChangeDoneView.as_view(template_name="users/password_change_done.html",), name="password_change_done",),
]
