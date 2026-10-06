import os
import getpass

# Ask for Render database URL
render_db_url = getpass.getpass(
    "Paste your Render External Database URL: "
)

os.environ["DATABASE_URL"] = render_db_url

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings")
django.setup()

from products.models import Product


# Get Product 13
product = Product.objects.get(id=13)

print("\nOLD IMAGE:")
print(product.image.name)

# Cloudinary public ID
product.image.name = "ecommerce/products/product_12"

product.save(update_fields=["image"])

product.refresh_from_db()

print("\nNEW IMAGE NAME:")
print(product.image.name)

print("\nNEW CLOUDINARY URL:")
print(product.image.url)