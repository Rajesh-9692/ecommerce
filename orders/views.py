from django.db import transaction
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated

from cart.models import Cart, CartItem
from products.models import Product

from .models import Order, OrderItem

from recommendations.utils import track_activity


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

        if product.stock <= 0:
            raise serializers.ValidationError(
                "Product is out of stock."
            )

        serializer.save(cart=cart)

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "price",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "items",
            "total_amount",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "user",
            "total_amount",
            "status",
        ]

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):

        with transaction.atomic():

            cart = Cart.objects.get(
                user=self.request.user
            )

            cart_items = cart.items.select_related("product").all()

            if not cart_items.exists():
                raise serializers.ValidationError(
                    "Your cart is empty."
                )

    
            for cart_item in cart_items:

                if cart_item.product.stock < cart_item.quantity:
                    raise serializers.ValidationError(
                        f"Not enough stock for {cart_item.product.name}."
                    )

    
            order = serializer.save(
                user=self.request.user,
                total_amount=0
            )

            total = 0

        
            for cart_item in cart_items:

                product = cart_item.product
                quantity = cart_item.quantity

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=product.price
                )

                total += product.price * quantity

            
                track_activity(
                    self.request.user,
                    product,
                    "purchase"
                )

            
                product.stock -= quantity
                product.save()

            order.total_amount = total
            order.save()

            cart_items.delete()