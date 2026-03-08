from django.urls import path
from . import views

urlpatterns = [
    # Dashboard API
    path('dashboard/', views.dashboard_api, name='dashboard_api'),
    path('dashboard/<int:pk>/', views.dashboard_api_detail, name='dashboard_api_detail'),
    # Add other API endpoints here
]
