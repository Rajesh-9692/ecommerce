from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ProductViewSet,
    ReviewViewSet,
)


router = DefaultRouter()

router.register("categories", CategoryViewSet)
router.register("products", ProductViewSet)
router.register("reviews", ReviewViewSet)


urlpatterns = [
    path("", include(router.urls)),
]