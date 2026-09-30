import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from products.models import Product


CATEGORY_RULES = {

    "Animals & Pet Supplies": {
        "price": (100, 10000),
        "stock": (10, 100),
    },

    "Apparel & Accessories": {
        "price": (300, 10000),
        "stock": (10, 100),
    },

    "Arts & Entertainment": {
        "price": (200, 20000),
        "stock": (5, 80),
    },

    "Baby & Toddler": {
        "price": (100, 10000),
        "stock": (10, 100),
    },

    "Business & Industrial": {
        "price": (1000, 100000),
        "stock": (3, 50),
    },

    "Cameras & Optics": {
        "price": (1000, 80000),
        "stock": (3, 30),
    },

    "Electronics": {
        "price": (1000, 100000),
        "stock": (5, 50),
    },

    "Food, Beverages & Tobacco": {
        "price": (20, 2000),
        "stock": (20, 200),
    },

    "Furniture": {
        "price": (1500, 50000),
        "stock": (3, 30),
    },

    "Gift Cards": {
        "price": (100, 10000),
        "stock": (20, 200),
    },

    "Hardware": {
        "price": (100, 20000),
        "stock": (5, 100),
    },

    "Health & Beauty": {
        "price": (100, 10000),
        "stock": (10, 100),
    },

    "Home & Garden": {
        "price": (100, 20000),
        "stock": (5, 80),
    },

    "Luggage & Bags": {
        "price": (500, 15000),
        "stock": (5, 80),
    },

    "Media": {
        "price": (100, 5000),
        "stock": (10, 100),
    },

    "Office Supplies": {
        "price": (50, 5000),
        "stock": (20, 200),
    },

    "Product Add-Ons": {
        "price": (50, 5000),
        "stock": (10, 100),
    },

    "Religious & Ceremonial": {
        "price": (100, 10000),
        "stock": (5, 80),
    },

    "Services": {
        "price": (500, 100000),
        "stock": (1, 20),
    },

    "Software": {
        "price": (500, 20000),
        "stock": (5, 100),
    },

    "Sporting Goods": {
        "price": (300, 15000),
        "stock": (5, 80),
    },

    "Toys & Games": {
        "price": (200, 10000),
        "stock": (10, 100),
    },

    "Uncategorized": {
        "price": (100, 5000),
        "stock": (10, 100),
    },

    "Vehicles & Parts": {
        "price": (1000, 200000),
        "stock": (2, 30),
    },
}


class Command(BaseCommand):

    help = "Set category-wise demo price and stock"

    def handle(self, *args, **kwargs):

        products = Product.objects.filter(price=0)

        total = products.count()

        self.stdout.write(
            f"Products with price 0: {total}"
        )

        updated = 0
        skipped = 0

        for product in products:

            if not product.category:
                skipped += 1
                continue

            # Get the main category.
            category_name = (
                product.category.name
                .split(">")[0]
                .strip()
            )

            rule = CATEGORY_RULES.get(category_name)

            if not rule:
                skipped += 1
                continue

            min_price, max_price = rule["price"]
            min_stock, max_stock = rule["stock"]

            # Use product ID so the generated
            # values stay consistent if rerun.
            rng = random.Random(product.id)

            price = round(
                rng.uniform(
                    min_price,
                    max_price
                ),
                2
            )

            stock = rng.randint(
                min_stock,
                max_stock
            )

            product.price = Decimal(
                str(price)
            )

            product.stock = stock

            product.save(
                update_fields=[
                    "price",
                    "stock"
                ]
            )

            updated += 1

            if updated % 500 == 0:
                self.stdout.write(
                    f"Updated {updated}/{total}"
                )

        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                "Category-wise price and stock update completed!"
            )
        )

        self.stdout.write(
            f"Updated products: {updated}"
        )

        self.stdout.write(
            f"Skipped products: {skipped}"
        )