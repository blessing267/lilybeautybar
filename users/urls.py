from django.urls import path
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
]
