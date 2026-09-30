from django.core.management.base import BaseCommand
from products.models import Category, Product


CATEGORY_MAP = {

    # Electronics
    "Electronics": "Electronics",
    "Cameras & Optics": "Electronics",
    "laptops": "Electronics",
    "smartphones": "Electronics",
    "tablets": "Electronics",
    "mobile-accessories": "Electronics",
    "Software": "Electronics",

    # Health & Beauty
    "Health & Beauty": "Health & Beauty",
    "beauty": "Health & Beauty",
    "fragrances": "Health & Beauty",
    "skin-care": "Health & Beauty",

    # Food
    "Food, Beverages & Tobacco": "Food, Beverages & Tobacco",
    "groceries": "Food, Beverages & Tobacco",

    # Furniture
    "Furniture": "Furniture",
    "furniture": "Furniture",

    # Home
    "Home & Garden": "Home & Garden",
    "home-decoration": "Home & Garden",
    "kitchen-accessories": "Home & Garden",

    # Apparel
    "Apparel & Accessories": "Apparel & Accessories",
    "mens-shirts": "Apparel & Accessories",
    "mens-shoes": "Apparel & Accessories",
    "mens-watches": "Apparel & Accessories",
    "tops": "Apparel & Accessories",
    "womens-bags": "Apparel & Accessories",
    "womens-dresses": "Apparel & Accessories",
    "womens-jewellery": "Apparel & Accessories",
    "womens-shoes": "Apparel & Accessories",
    "womens-watches": "Apparel & Accessories",
    "sunglasses": "Apparel & Accessories",

    # Sporting
    "Sporting Goods": "Sporting Goods",
    "sports-accessories": "Sporting Goods",

    # Vehicles
    "Vehicles & Parts": "Vehicles & Parts",
    "vehicle": "Vehicles & Parts",
    "motorcycle": "Vehicles & Parts",

    # Everything else
    "Animals & Pet Supplies": "Animals & Pet Supplies",
    "Arts & Entertainment": "Arts & Entertainment",
    "Baby & Toddler": "Baby & Toddler",
    "Business & Industrial": "Business & Industrial",
    "Gift Cards": "Gift Cards",
    "Hardware": "Hardware",
    "Luggage & Bags": "Luggage & Bags",
    "Media": "Media",
    "Office Supplies": "Office Supplies",
    "Product Add-Ons": "Product Add-Ons",
    "Religious & Ceremonial": "Religious & Ceremonial",
    "Services": "Services",
    "Toys & Games": "Toys & Games",
    "Uncategorized": "Uncategorized",
}


class Command(BaseCommand):
    help = "Normalize product categories"

    def handle(self, *args, **kwargs):

        self.stdout.write(
            "Starting category normalization..."
        )

        # --------------------------------------------------
        # Create canonical categories
        # --------------------------------------------------

        canonical_names = set(
            CATEGORY_MAP.values()
        )

        canonical_categories = {}

        for name in canonical_names:

            category, _ = Category.objects.get_or_create(
                name=name,
                defaults={
                    "description":
                    f"Products in {name}"
                }
            )

            canonical_categories[name] = category


        # --------------------------------------------------
        # Move products
        # --------------------------------------------------

        updated_products = 0

        categories = Category.objects.all()

        for category in categories:

            old_name = category.name

            new_name = CATEGORY_MAP.get(
                old_name
            )

            # Do not touch categories that are not
            # explicitly mapped here.
            if not new_name:
                continue

            target_category = (
                canonical_categories[new_name]
            )

            if category.id == target_category.id:
                continue

            count = Product.objects.filter(
                category=category
            ).update(
                category=target_category
            )

            if count > 0:

                self.stdout.write(
                    f"{old_name} -> {new_name} "
                    f"({count} products)"
                )

                updated_products += count


        # --------------------------------------------------
        # Delete old categories
        # --------------------------------------------------

        deleted_categories = 0

        for category in list(
            Category.objects.all()
        ):

            if category.name in canonical_names:
                continue

            new_name = CATEGORY_MAP.get(
                category.name
            )

            if new_name:

                category.delete()

                deleted_categories += 1


        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                "Category normalization completed."
            )
        )

        self.stdout.write(
            f"Products updated: {updated_products}"
        )

        self.stdout.write(
            f"Old categories deleted: "
            f"{deleted_categories}"
        )