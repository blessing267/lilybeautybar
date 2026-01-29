from django.urls import path
from . import views

urlpatterns = [
    # Public shop pages
    path('', views.home, name='home'),
    path('products/', views.product_list, name='product_list'),
    path('products/<int:pk>/', views.product_detail, name='product_detail'),
    
    # Dashboard (API)
    path('api/dashboard/', views.dashboard_api, name='dashboard_api'),
    
    # Dashboard (HTML)
    path('dashboard/', views.dashboard, name='dashboard'),
    path('dashboard/product/add/', views.add_product, name='add_product'),
    path('dashboard/product/<int:pk>/edit/', views.edit_product, name='edit_product'),

    #Stripe checkout
    path('checkout/<int:product_id>/', views.checkout, name='checkout'),
    path('success/', views.success, name='success'),
    path('cancel/', views.cancel, name='cancel'),
]
