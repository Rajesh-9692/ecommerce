from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from cart.models import Cart, CartItem
from products.models import Category, Product
from .models import Order


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
	DEFAULT_FROM_EMAIL="orders@example.com",
	SECURE_SSL_REDIRECT=False
)
class OrderConfirmationEmailTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username="email-shopper",
			email="shopper@example.com",
			password="test-password"
		)
		category = Category.objects.create(name="Home")
		self.product = Product.objects.create(
			name="Desk lamp",
			description="A small desk lamp.",
			category=category,
			price=Decimal("25.00"),
			stock=5,
			brand="MyShop"
		)
		cart = Cart.objects.create(user=self.user)
		CartItem.objects.create(cart=cart, product=self.product, quantity=2)
		self.client.force_authenticate(user=self.user)

	def place_order(self):
		with self.captureOnCommitCallbacks(execute=True):
			return self.client.post("/orders/api/", {}, format="json")

	def test_order_sends_confirmation_to_registered_email(self):
		response = self.place_order()

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(len(mail.outbox), 1)
		self.assertEqual(mail.outbox[0].to, ["shopper@example.com"])
		self.assertIn("Order #", mail.outbox[0].subject)
		self.assertIn("Desk lamp x 2", mail.outbox[0].body)
		self.assertIn("₹50.00", mail.outbox[0].body)

	def test_order_without_email_is_still_created(self):
		self.user.email = ""
		self.user.save(update_fields=["email"])

		response = self.place_order()

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(Order.objects.filter(user=self.user).count(), 1)
		self.assertEqual(mail.outbox, [])

	def test_email_failure_does_not_undo_order(self):
		with patch("orders.emails.send_mail", side_effect=OSError("SMTP unavailable")):
			with self.assertLogs("orders.emails", level="ERROR"):
				response = self.place_order()

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(Order.objects.filter(user=self.user).count(), 1)
