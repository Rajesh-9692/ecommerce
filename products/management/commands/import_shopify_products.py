import csv
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand

from products.models import Product, Category


class Command(BaseCommand):
    help = "Import Shopify products and images into Django"

    def handle(self, *args, **kwargs):

        # --------------------------------------------------
        # FILE LOCATIONS
        # --------------------------------------------------

        base_dir = Path.cwd()

        csv_file = base_dir / "shopify_products_10000.csv"
        image_dir = base_dir / "shopify_product_images"

        if not csv_file.exists():
            self.stdout.write(
                self.style.ERROR(
                    f"CSV file not found: {csv_file}"
                )
            )
            return

        if not image_dir.exists():
            self.stdout.write(
                self.style.ERROR(
                    f"Image folder not found: {image_dir}"
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                "Starting Shopify product import..."
            )
        )

        # --------------------------------------------------
        # COUNTERS
        # --------------------------------------------------

        created_count = 0
        updated_count = 0
        skipped_count = 0
        image_count = 0

        # --------------------------------------------------
        # OPEN CSV
        # --------------------------------------------------

        with open(
            csv_file,
            "r",
            encoding="utf-8",
            newline=""
        ) as file:

            reader = csv.DictReader(file)

            for number, row in enumerate(
                reader,
                start=1
            ):

                name = (
                    row.get("name") or
                    f"Shopify Product {number}"
                ).strip()

                description = (
                    row.get("description") or
                    ""
                ).strip()

                brand = (
                    row.get("brand") or
                    "Unknown"
                ).strip()

                category_name = (
                    row.get("category") or
                    "Other"
                ).strip()

                image_filename = (
                    row.get("image") or
                    ""
                ).strip()

                # --------------------------------------------------
                # CATEGORY
                # --------------------------------------------------

                category, _ = Category.objects.get_or_create(
                    name=category_name,
                    defaults={
                        "description":
                        f"Products in {category_name}"
                    }
                )

                # --------------------------------------------------
                # IMAGE PATH
                # --------------------------------------------------

                image_path = None

                if image_filename:

                    image_path = (
                        image_dir /
                        image_filename
                    )

                    if not image_path.exists():
                        image_path = None

                # --------------------------------------------------
                # CHECK IF THIS SHOPIFY PRODUCT WAS ALREADY IMPORTED
                # --------------------------------------------------

                shopify_image_name = None

                if image_filename:
                    shopify_image_name = (
                        f"products/{image_filename}"
                    )

                existing_product = None

                if shopify_image_name:
                    existing_product = (
                        Product.objects.filter(
                            image=shopify_image_name
                        ).first()
                    )

                # --------------------------------------------------
                # CREATE OR UPDATE
                # --------------------------------------------------

                if existing_product:

                    product = existing_product

                    product.name = name
                    product.description = description
                    product.category = category
                    product.brand = brand

                    # Dataset doesn't provide price.
                    if product.price is None:
                        product.price = 0

                    # Keep existing stock.
                    if product.stock is None:
                        product.stock = 100

                    product.save()

                    updated_count += 1

                else:

                    product = Product.objects.create(
                        name=name,
                        description=description,
                        category=category,
                        price=0.00,
                        stock=100,
                        brand=brand,
                    )

                    created_count += 1

                # --------------------------------------------------
                # SAVE IMAGE
                # --------------------------------------------------

                if image_path:

                    current_image_name = (
                        product.image.name
                        if product.image
                        else ""
                    )

                    if (
                        not current_image_name
                        or current_image_name !=
                        f"products/{image_filename}"
                    ):

                        with open(
                            image_path,
                            "rb"
                        ) as image_file:

                            product.image.save(
                                image_filename,
                                File(image_file),
                                save=True
                            )

                        image_count += 1

                # --------------------------------------------------
                # PROGRESS
                # --------------------------------------------------

                if number % 100 == 0:

                    self.stdout.write(
                        f"Processed: {number}"
                    )

        # --------------------------------------------------
        # FINISHED
        # --------------------------------------------------

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "===================================="
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Shopify import completed!"
            )
        )
        self.stdout.write(
            f"New products: {created_count}"
        )
        self.stdout.write(
            f"Updated products: {updated_count}"
        )
        self.stdout.write(
            f"Images imported: {image_count}"
        )
        self.stdout.write(
            f"Skipped/unchanged: {skipped_count}"
        )
        self.stdout.write(
            self.style.SUCCESS(
                "===================================="
            )
        )