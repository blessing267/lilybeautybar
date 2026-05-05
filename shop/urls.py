from django.urls import path
from . import views

urlpatterns = [
    # Public shop pages
    path('', views.home, name='home'),
    path('contact/', views.contact, name='contact'),
    path('products/', views.product, name='products'),
    path('product/', views.product_list, name='product_list'),
    path('product/<int:pk>/', views.product_detail, name='product_detail'),
    path('orders/', views.orders, name='orders'),

    # Dashboard (API)
    path('dashboard-api/', views.dashboard_api, name='dashboard_api'),
    path('dashboard-api/<int:pk>/', views.dashboard_api_detail, name='dashboard_api_detail'),

    # Dashboard (HTML)
    path('dashboard/', views.dashboard, name='dashboard'),

    #Paystack
    path('checkout/<int:product_id>/', views.checkout, name='checkout'),
    path('success/', views.success, name='success'),
    path('paystack/webhook/', views.paystack_webhook, name='paystack_webhook'),
]
