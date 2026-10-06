import os
from pathlib import Path

import django
import cloudinary
import cloudinary.uploader
import cloudinary.api
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
FOLDER = "ecommerce/products"


# ==========================================
# GET EXISTING CLOUDINARY ASSETS
# ==========================================

print("Checking Cloudinary...")

existing_images = set()
next_cursor = None

while True:

    if next_cursor:
        result = cloudinary.api.resources(
            type="upload",
            prefix=FOLDER,
            max_results=500,
            next_cursor=next_cursor,
        )
    else:
        result = cloudinary.api.resources(
            type="upload",
            prefix=FOLDER,
            max_results=500,
        )

    for resource in result.get("resources", []):
        existing_images.add(resource["public_id"])

    next_cursor = result.get("next_cursor")

    if not next_cursor:
        break


print()
print("Existing Cloudinary assets:", len(existing_images))
print()


# ==========================================
# GET PRODUCTS
# ==========================================

products = Product.objects.exclude(image="")

total = products.count()

print("Total products:", total)
print()


uploaded = 0
skipped = 0
missing = 0
failed = 0


# ==========================================
# PROCESS ALL PRODUCTS
# ==========================================

for number, product in enumerate(products, 1):

    image_name = product.image.name

    file_path = MEDIA_ROOT / image_name

    public_id = f"{FOLDER}/{Path(image_name).stem}"

    print(f"[{number}/{total}] {image_name}")


    # --------------------------------------
    # LOCAL FILE DOES NOT EXIST
    # --------------------------------------

    if not file_path.exists():

        print("  MISSING LOCAL FILE")

        missing += 1

        continue


    # --------------------------------------
    # ALREADY EXISTS IN CLOUDINARY
    # --------------------------------------

    if public_id in existing_images:

        print("  SKIPPED - Already exists")

        skipped += 1

        continue


    # --------------------------------------
    # UPLOAD ONLY NEW IMAGE
    # --------------------------------------

    try:

        cloudinary.uploader.upload(
            str(file_path),
            folder=FOLDER,
            public_id=Path(image_name).stem,
            overwrite=False,
            resource_type="image",
        )

        print("  UPLOADED")

        uploaded += 1

        # Add immediately so it won't be uploaded again
        existing_images.add(public_id)


    except Exception as e:

        print("  FAILED:", e)

        failed += 1


# ==========================================
# FINAL RESULT
# ==========================================

print()
print("========================================")
print("UPLOAD COMPLETE")
print("========================================")

print("Total products :", total)
print("Already existed:", skipped)
print("New uploads    :", uploaded)
print("Missing files  :", missing)
print("Failed uploads :", failed)