import logging

from django.conf import settings
from django.core.mail import send_mail

from .models import Order


logger = logging.getLogger(__name__)


def send_order_confirmation(order_id):
	try:
		order = (
			Order.objects
			.select_related("user")
			.prefetch_related("items__product")
			.get(pk=order_id)
		)
		recipient = (order.user.email or "").strip()

		if not recipient:
			logger.warning(
				"Skipping confirmation for order %s: account has no email address",
				order_id
			)
			return False

		item_lines = [
			f"- {item.product.name} x {item.quantity}: "
			f"₹{item.price} each"
			for item in order.items.all()
		]
		message = "\n".join([
			f"Hello {order.user.username},",
			"",
			f"Your order #{order.pk} has been placed successfully.",
			"",
			"Items:",
			*item_lines,
			"",
			f"Total: ₹{order.total_amount}",
			f"Status: {order.status}",
			"",
			"Thank you for shopping with MyShop."
		])
        
		return send_mail(
			subject=f"MyShop order confirmation - Order #{order.pk}",
			message=message,
			from_email=settings.DEFAULT_FROM_EMAIL,
			recipient_list=[recipient],
			fail_silently=False
		) == 1
	except Exception:
		logger.exception("Could not send confirmation email for order %s", order_id)
		return False