import requests

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile

from products.models import Product, Category


API_URL = "https://dummyjson.com/products?limit=0"


class Command(BaseCommand):

    help = "Import products from DummyJSON API"

    def handle(self, *args, **kwargs):

        self.stdout.write(
            "Fetching products from DummyJSON..."
        )

        try:

            response = requests.get(
                API_URL,
                timeout=30
            )

            response.raise_for_status()

            data = response.json()

        except requests.RequestException as error:

            self.stdout.write(
                self.style.ERROR(
                    f"API request failed: {error}"
                )
            )

            return

        products = data.get("products", [])

        if not products:

            self.stdout.write(
                self.style.WARNING(
                    "No products found in API."
                )
            )

            return

        imported_count = 0
        updated_count = 0

        for item in products:

            category_name = item.get(
                "category",
                "uncategorized"
            )

            category, created = Category.objects.get_or_create(
                name=category_name,
                defaults={
                    "description":
                    f"Products in {category_name} category"
                }
            )

            product, created = Product.objects.update_or_create(

                name=item.get(
                    "title",
                    "Unknown Product"
                ),

                defaults={

                    "description": item.get(
                        "description",
                        ""
                    ),

                    "category": category,

                    "price": item.get(
                        "price",
                        0
                    ),

                    "stock": item.get(
                        "stock",
                        0
                    ),

                    "brand": item.get(
                        "brand",
                        "Unknown"
                    ),
                }
            )

            image_url = item.get("thumbnail")

            if image_url:

                try:

                    image_response = requests.get(
                        image_url,
                        timeout=30
                    )

                    image_response.raise_for_status()

                    content_type = image_response.headers.get(
                        "Content-Type",
                        ""
                    )

                    if "png" in content_type:
                        extension = "png"

                    elif "webp" in content_type:
                        extension = "webp"

                    elif "jpeg" in content_type:
                        extension = "jpg"

                    else:
                        extension = "jpg"

                    image_name = (
                        f"product_{item.get('id')}.{extension}"
                    )

                    product.image.save(
                        image_name,
                        ContentFile(image_response.content),
                        save=False
                    )

                except requests.RequestException as error:

                    self.stdout.write(
                        self.style.WARNING(
                            f"Image download failed for "
                            f"{product.name}: {error}"
                        )
                    )

            product.save()

            if created:

                imported_count += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Added: {product.name}"
                    )
                )

            else:

                updated_count += 1

                self.stdout.write(
                    f"Updated: {product.name}"
                )

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                "Import completed!"
            )
        )

        self.stdout.write(
            f"New products: {imported_count}"
        )

        self.stdout.write(
            f"Updated products: {updated_count}"
        )