import os
from pathlib import Path

import django
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings")
django.setup()

from products.models import Product

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

MEDIA_ROOT = Path("media")

products = Product.objects.exclude(image="")

total = products.count()
success = 0
missing = 0
failed = 0

print(f"Products to process: {total}")

for number, product in enumerate(products, 1):

    image_name = product.image.name
    file_path = MEDIA_ROOT / image_name

    print(f"[{number}/{total}] {image_name}")

    if not file_path.exists():
        print("  MISSING")
        missing += 1
        continue

    try:
        cloudinary.uploader.upload(
            str(file_path),
            folder="ecommerce/products",
            public_id=Path(image_name).stem,
            overwrite=True,
            resource_type="image",
        )

        print("  SUCCESS")
        success += 1

    except Exception as e:
        print(f"  FAILED: {e}")
        failed += 1

print("\n========== COMPLETE ==========")
print(f"Success : {success}")
print(f"Missing : {missing}")
print(f"Failed  : {failed}")