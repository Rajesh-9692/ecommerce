from django.shortcuts import render
from django.db.models import Q
from products.models import Category, Product


def home(request):
    return render(request, "index.html")


def products_page(request):
    return render(request, "products.html")

def categories_page(request):

    category_names = (
        Category.objects
        .values_list("name", flat=True)
        .order_by("name")
    )

    top_categories = set()

    for name in category_names:

        if not name:
            continue

        if ">" in name:
            top_category = name.split(">")[0].strip()
        else:
            top_category = name.strip()

        if top_category:
            top_categories.add(top_category)

    top_categories = sorted(
        top_categories,
        key=str.casefold
    )

    category_data = []

    for category_name in top_categories:

        product = (
            Product.objects
            .filter(
                Q(category__name=category_name) |
                Q(
                    category__name__startswith=
                    category_name + " >"
                ),
                image__isnull=False
            )
            .exclude(image="")
            .order_by("id")
            .first()
        )

        category_data.append({
            "name": category_name,
            "image": product.image if product else None
        })

    return render(
        request,
        "categories.html",
        {
            "categories": category_data
        }
    )

def product_details(request):
    return render(request, "product-details.html")


def login_page(request):
    return render(request, "login.html")


def register_page(request):
    return render(request, "register.html")


def cart_page(request):
    return render(request, "cart.html")


def checkout_page(request):
    return render(request, "checkout.html")


def orders_page(request):
    return render(request, "orders.html")


def profile_page(request):
    return render(request, "profile.html")