from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.serializers import ProductSerializer
from .ai_engine import (
    get_similar_products,
    get_user_recommendations,
)


class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        product_id = request.GET.get("product_id")

        # Product-based recommendations
        if product_id:
            try:
                product_id = int(product_id)
            except ValueError:
                return Response(
                    {"error": "Invalid product_id"},
                    status=400
                )

            recommendations = get_similar_products(
                product_id,
                limit=5
            )

            return Response(
                ProductSerializer(
                    recommendations,
                    many=True
                ).data
            )

        # Personalized recommendations
        recommendations = get_user_recommendations(
            request.user,
            limit=5
        )

        return Response(
            ProductSerializer(
                recommendations,
                many=True
            ).data
        )


# Keep this for compatibility with the existing URL for now.
def index(request):
    return RecommendationView.as_view()(request)