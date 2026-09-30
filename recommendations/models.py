from django.db import models
from django.contrib.auth.models import User
from products.models import Product


class UserActivity(models.Model):
    ACTIVITY_CHOICES = [
        ("view", "View"),
        ("search", "Search"),
        ("cart", "Cart"),
        ("purchase", "Purchase"),
        ("rating", "Rating"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="activities"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="user_activities",
        null=True,
        blank=True
    )

    search_query = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    activity_type = models.CharField(
        max_length=20,
        choices=ACTIVITY_CHOICES
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.activity_type == "search":
            return f"{self.user.username} - Search: {self.search_query}"

        return f"{self.user.username} - {self.product.name} - {self.activity_type}"