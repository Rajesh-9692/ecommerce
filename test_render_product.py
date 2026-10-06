import os
import django
from getpass import getpass

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings")

# Ask for Render External Database URL
database_url = getpass("Paste Render External Database URL: ")

os.environ["DATABASE_URL"] = database_url

django.setup()

from products.models import Product

product = Product.objects.get(id=13)

print("\nBEFORE:")
print("Image:", product.image.name)

product.image.name = "ecommerce/products/product_12"
product.save(update_fields=["image"])

product.refresh_from_db()

print("\nAFTER:")
print("Image:", product.image.name)
print("URL:", product.image.url)