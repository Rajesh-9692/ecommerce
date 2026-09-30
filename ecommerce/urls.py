"""
URL configuration for ecommerce project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

# path("",include())

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from . import views


admin.site.site_header = "Rajesh Website"
admin.site.index_title = "Welcome To My Website"


urlpatterns = [

    # Frontend pages
    path("", views.home, name="home"),
    path("products/", views.products_page, name="products"),
    path("categories/", views.categories_page, name="categories"),
    path("product-details/", views.product_details, name="product-details"),
    path("login/", views.login_page, name="login"),
    path("register/", views.register_page, name="register"),
    path("cart/", views.cart_page, name="cart"),
    path("checkout/", views.checkout_page, name="checkout"),
    path("orders/", views.orders_page, name="orders"),
    path("profile/", views.profile_page, name="profile"),


    # Backend APIs
    path("admin/", admin.site.urls),
    path("cart/api/", include("cart.urls")),
    path("orders/api/", include("orders.urls")),
    path("products/api/", include("products.urls")),
    path("users/api/", include("users.urls")),
    path("recommendations/", include("recommendations.urls")),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )