from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    # Public shop pages
    path('', views.home, name='home'),
    path('contact/', views.contact, name='contact'),
    path('products/', views.product, name='products'),
    path('product/<int:pk>/', views.product_detail, name='product_detail'),
    path('orders/', views.orders, name='orders'),
    path('cart/', views.cart, name='cart'),
    path('add-to-cart/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('remove-from-cart/<str:cart_key>/', views.remove_from_cart, name='remove_from_cart'),
    path('update-cart/<str:cart_key>/', views.update_cart, name='update_cart'),
    path('checkout/', views.checkout, name='checkout'),

    # Dashboard (API)
    path('dashboard-api/', views.dashboard_api, name='dashboard_api'),
    path('dashboard-api/<int:pk>/', views.dashboard_api_detail, name='dashboard_api_detail'),
    path("categories/", views.categories_api, name="categories_api"),
    path("categories/<int:pk>/", views.categories_api, name="category_detail_api"),
    path("subcategories/", views.subcategories_api, name="subcategories_api"),
    path("subcategories/<int:pk>/", views.subcategories_api, name="subcategory_detail_api"),

    # Dashboard (HTML)
    path('dashboard/', views.dashboard, name='dashboard'),

    #Paystack
    path('success/', views.success, name='success'),
    path('paystack/webhook/', views.paystack_webhook, name='paystack_webhook'),

    #Logout
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
]
