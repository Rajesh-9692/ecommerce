from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from recommendations.utils import track_activity

from .models import Cart, CartItem
from products.models import Product

from rest_framework import serializers


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    product_price = serializers.DecimalField(
        source="product.price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Cart
        fields = [
            "id",
            "user",
            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = ["user"]


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(
            cart__user=self.request.user
        )

    def perform_create(self, serializer):
        cart, created = Cart.objects.get_or_create(
            user=self.request.user
        )

        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]

        if quantity <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than 0."
            )

        if product.stock < quantity:
            raise serializers.ValidationError(
                f"Only {product.stock} items are available."
            )

        serializer.save(cart=cart)

        track_activity(
            self.request.user,
            product,
            "cart"
        )