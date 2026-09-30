from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from .models import Category, Product, Review

from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ReviewSerializer,
)

from recommendations.utils import track_activity

class ProductPagination(PageNumberPagination):
    page_size = 40
    page_size_query_param = "page_size"
    max_page_size = 100

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductPagination

    def get_queryset(self):

        queryset = Product.objects.all()


        category = self.request.query_params.get("category")

        if category:

            category = category.strip()

            if category == "Electronics":

                queryset = queryset.filter(
                    Q(category__name="Electronics") |
                    Q(category__name__startswith="Electronics >") |
                    Q(category__name="Software") |
                    Q(category__name__startswith="Software >") |
                    Q(category__name="Business & Industrial") |
                    Q(category__name__startswith="Business & Industrial >")
                )

            else:

                queryset = queryset.filter(
                    Q(category__name=category) |
                    Q(
                        category__name__startswith=
                        category + " >"
                    )
                )

        # --------------------------------------------
        # Product search
        # --------------------------------------------

        search = self.request.query_params.get("search")

        if search:

            search = search.strip()

            if search:

                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(description__icontains=search) |
                    Q(brand__icontains=search) |
                    Q(category__name__icontains=search)
                )

        return queryset

    def retrieve(self, request, *args, **kwargs):

        product = self.get_object()

        if request.user.is_authenticated:
            track_activity(
                request.user,
                product,
                "view"
            )

        serializer = self.get_serializer(product)

        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save(
            user=self.request.user
        )

        track_activity(
            self.request.user,
            review.product,
            "rating"
        )