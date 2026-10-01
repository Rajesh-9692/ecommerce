from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(SECURE_SSL_REDIRECT=False)
class ProfileApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			username="shopper",
			email="shopper@example.com",
			password="test-password"
		)
		self.url = reverse("user_profile")
		self.client.force_authenticate(user=self.user)

	def test_patch_updates_username_and_email(self):
		response = self.client.patch(
			self.url,
			{"username": "new-shopper", "email": "new@example.com"},
			format="json"
		)

		self.user.refresh_from_db()

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(self.user.username, "new-shopper")
		self.assertEqual(self.user.email, "new@example.com")
		self.assertEqual(response.data["username"], "new-shopper")

	def test_patch_rejects_duplicate_username(self):
		User.objects.create_user(username="taken", password="test-password")

		response = self.client.patch(
			self.url,
			{"username": "taken"},
			format="json"
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.user.refresh_from_db()
		self.assertEqual(self.user.username, "shopper")

	def test_patch_requires_authentication(self):
		self.client.force_authenticate(user=None)

		response = self.client.patch(
			self.url,
			{"email": "new@example.com"},
			format="json"
		)

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(SECURE_SSL_REDIRECT=False)
class RegisterApiEmailTests(APITestCase):
	def test_registration_saves_email_address(self):
		response = self.client.post(
			"/users/api/register/",
			{
				"username": "new-shopper",
				"email": "new-shopper@example.com",
				"password": "test-password"
			},
			format="json"
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		user = User.objects.get(username="new-shopper")
		self.assertEqual(user.email, "new-shopper@example.com")
