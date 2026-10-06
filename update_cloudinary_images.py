import os
import django
from getpass import getpass

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings")

# Connect to Render PostgreSQL
database_url = getpass("Paste Render External Database URL: ")
os.environ["DATABASE_URL"] = database_url

django.setup()

from products.models import Product


products = Product.objects.exclude(image="")

total = products.count()
updated = 0

print(f"\nTotal products with images: {total}")
print("Starting update...\n")

for product in products.iterator():
    old_name = product.image.name

    # Example:
    # products/product_12.webp
    # becomes:
    # ecommerce/products/product_12

    filename = os.path.basename(old_name)
    stem = os.path.splitext(filename)[0]

    new_name = f"ecommerce/products/{stem}"

    if old_name != new_name:
        product.image.name = new_name
        product.save(update_fields=["image"])
        updated += 1

    if updated % 500 == 0 and updated > 0:
        print(f"Updated: {updated}")

print("\n================================")
print("UPDATE COMPLETE")
print("================================")
print(f"Total products: {total}")
print(f"Updated: {updated}")
print("================================")