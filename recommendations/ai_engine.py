from collections import defaultdict

from django.db.models import Count, Max

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import UserActivity
from products.models import Product


# ============================================================
# TF-IDF CACHE
# ============================================================

_tfidf_vectorizer = None
_tfidf_matrix = None
_tfidf_product_ids = []
_tfidf_product_map = {}
_tfidf_signature = None


# ============================================================
# PRODUCT TEXT
# ============================================================

def build_product_text(product):
    """
    Combine important product information into one text string.
    """

    category_name = ""

    if product.category:
        category_name = product.category.name or ""

    return " ".join([
        product.name or "",
        product.description or "",
        category_name,
        product.brand or "",
    ])


# ============================================================
# BUILD / CACHE TF-IDF INDEX
# ============================================================

def _get_product_signature():
    """
    Cheap database check used to determine whether
    the cached TF-IDF index is still valid.
    """

    data = Product.objects.aggregate(
        total=Count("id"),
        latest=Max("updated_at")
    )

    return (
        data["total"],
        data["latest"]
    )


def _build_tfidf_index():
    """
    Build the TF-IDF index once and keep it in memory.
    """

    global _tfidf_vectorizer
    global _tfidf_matrix
    global _tfidf_product_ids
    global _tfidf_product_map
    global _tfidf_signature

    products = list(
        Product.objects
        .select_related("category")
        .order_by("id")
    )

    if not products:
        _tfidf_vectorizer = None
        _tfidf_matrix = None
        _tfidf_product_ids = []
        _tfidf_product_map = {}
        _tfidf_signature = _get_product_signature()
        return

    product_texts = [
        build_product_text(product)
        for product in products
    ]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=30000
    )

    tfidf_matrix = vectorizer.fit_transform(
        product_texts
    )

    _tfidf_vectorizer = vectorizer
    _tfidf_matrix = tfidf_matrix

    _tfidf_product_ids = [
        product.id
        for product in products
    ]

    _tfidf_product_map = {
        product.id: product
        for product in products
    }

    _tfidf_signature = _get_product_signature()


def _ensure_tfidf_index():
    """
    Build the TF-IDF index only when necessary.
    """

    global _tfidf_signature

    current_signature = _get_product_signature()

    if (
        _tfidf_vectorizer is None
        or _tfidf_matrix is None
        or _tfidf_signature != current_signature
    ):
        _build_tfidf_index()


# ============================================================
# CONTENT-BASED RECOMMENDATION
# TF-IDF + COSINE SIMILARITY
# ============================================================

def get_similar_products(product_id, limit=5):
    """
    Return products most similar to a given product.
    """

    _ensure_tfidf_index()

    if _tfidf_matrix is None:
        return []

    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return []

    try:
        target_index = _tfidf_product_ids.index(
            product_id
        )
    except ValueError:
        return []

    similarity_scores = cosine_similarity(
        _tfidf_matrix[target_index],
        _tfidf_matrix
    ).flatten()

    similar_indexes = (
        similarity_scores.argsort()[::-1]
    )

    recommendations = []

    for index in similar_indexes:

        if index == target_index:
            continue

        product_id = _tfidf_product_ids[index]

        product = _tfidf_product_map.get(
            product_id
        )

        if product:
            recommendations.append(product)

        if len(recommendations) >= limit:
            break

    return recommendations


# ============================================================
# BEHAVIOR-BASED RECOMMENDATION
# CART + PURCHASE
# ============================================================

def get_behavior_recommendations(user, limit=5):
    """
    Recommend products based primarily on cart and
    purchase behavior from other users.
    """

    # --------------------------------------------------------
    # 1. Products current user carted / purchased
    # --------------------------------------------------------

    user_activities = (
        UserActivity.objects
        .filter(
            user=user,
            activity_type__in=[
                "purchase",
                "cart"
            ],
            product__isnull=False
        )
        .values(
            "product_id",
            "activity_type"
        )
    )

    seed_product_ids = list(
        user_activities
        .values_list(
            "product_id",
            flat=True
        )
        .distinct()
    )

    if not seed_product_ids:
        return []


    # --------------------------------------------------------
    # 2. Find other users who interacted
    #    with the same products
    # --------------------------------------------------------

    similar_user_ids = (
        UserActivity.objects
        .filter(
            product_id__in=seed_product_ids,
            activity_type__in=[
                "purchase",
                "cart"
            ]
        )
        .exclude(
            user=user
        )
        .values_list(
            "user_id",
            flat=True
        )
        .distinct()
    )

    if not similar_user_ids:
        return []


    # --------------------------------------------------------
    # 3. Find products those users also interacted with
    # --------------------------------------------------------

    candidate_activities = (
        UserActivity.objects
        .filter(
            user_id__in=similar_user_ids,
            activity_type__in=[
                "purchase",
                "cart"
            ],
            product__isnull=False
        )
        .exclude(
            product_id__in=seed_product_ids
        )
        .values(
            "user_id",
            "product_id",
            "activity_type"
        )
    )

    if not candidate_activities.exists():
        return []


    # --------------------------------------------------------
    # 4. Calculate scores
    # --------------------------------------------------------

    activity_weights = {
        "purchase": 5,
        "cart": 4,
    }

    user_product_scores = {}

    for activity in candidate_activities:

        key = (
            activity["user_id"],
            activity["product_id"]
        )

        weight = activity_weights.get(
            activity["activity_type"],
            1
        )

        current_score = (
            user_product_scores.get(
                key,
                0
            )
        )

        # Keep only the strongest action
        # for each user/product pair.
        if weight > current_score:
            user_product_scores[key] = weight


    if not user_product_scores:
        return []


    # --------------------------------------------------------
    # 5. Aggregate score for each product
    # --------------------------------------------------------

    product_scores = defaultdict(float)
    product_users = defaultdict(set)

    for (
        user_id,
        product_id
    ), weight in user_product_scores.items():

        product_scores[product_id] += weight

        product_users[product_id].add(
            user_id
        )


    # --------------------------------------------------------
    # 6. Reward products used by many users
    # --------------------------------------------------------

    final_scores = {}

    for product_id, score in product_scores.items():

        number_of_users = len(
            product_users[product_id]
        )

        final_scores[product_id] = (
            score +
            (number_of_users * 2)
        )


    # --------------------------------------------------------
    # 7. Remove products current user already used
    # --------------------------------------------------------

    already_interacted = set(
        UserActivity.objects
        .filter(
            user=user,
            product__isnull=False
        )
        .values_list(
            "product_id",
            flat=True
        )
    )

    for product_id in already_interacted:
        final_scores.pop(
            product_id,
            None
        )


    if not final_scores:
        return []


    # --------------------------------------------------------
    # 8. Sort
    # --------------------------------------------------------

    sorted_product_ids = sorted(
        final_scores,
        key=final_scores.get,
        reverse=True
    )


    sorted_product_ids = (
        sorted_product_ids[:limit]
    )

    if not sorted_product_ids:
        return []


    # --------------------------------------------------------
    # 9. Get products while preserving score order
    # --------------------------------------------------------

    products = Product.objects.filter(
        id__in=sorted_product_ids
    )

    product_map = {
        product.id: product
        for product in products
    }

    return [
        product_map[product_id]
        for product_id in sorted_product_ids
        if product_id in product_map
    ]


# ============================================================
# HYBRID PERSONALIZED RECOMMENDATION
# ============================================================

def get_user_recommendations(user, limit=5):
    """
    Personalized recommendation system.

    Priority:
        1. Cart/Purchase behavior
        2. TF-IDF content similarity as fallback
    """

    # --------------------------------------------------------
    # 1. Behavior-based recommendations first
    # --------------------------------------------------------

    behavior_recommendations = (
        get_behavior_recommendations(
            user,
            limit=limit
        )
    )

    if len(behavior_recommendations) >= limit:
        return behavior_recommendations[:limit]


    # --------------------------------------------------------
    # 2. Prepare user's activity
    # --------------------------------------------------------

    activities = list(
        UserActivity.objects
        .filter(
            user=user,
            product__isnull=False
        )
        .select_related(
            "product",
            "product__category"
        )
        .order_by("-timestamp")
    )

    if not activities:
        return behavior_recommendations[:limit]


    # --------------------------------------------------------
    # 3. Activity weights
    # --------------------------------------------------------

    activity_weights = {
        "purchase": 5,
        "cart": 4,
        "rating": 3,
        "view": 2,
        "search": 1,
    }


    # --------------------------------------------------------
    # 4. Build one weighted user profile
    #
    # This replaces repeatedly calling
    # get_similar_products() for every activity.
    # --------------------------------------------------------

    _ensure_tfidf_index()

    if _tfidf_matrix is None:
        return behavior_recommendations[:limit]


    profile_vectors = []
    profile_weights = []


    for activity in activities:

        product_id = activity.product.id

        try:
            product_index = (
                _tfidf_product_ids.index(
                    product_id
                )
            )
        except ValueError:
            continue

        weight = activity_weights.get(
            activity.activity_type,
            1
        )

        profile_vectors.append(
            _tfidf_matrix[product_index]
        )

        profile_weights.append(
            weight
        )


    if not profile_vectors:
        return behavior_recommendations[:limit]


    # --------------------------------------------------------
    # 5. Create weighted profile vector
    # --------------------------------------------------------

    weighted_profile = (
        profile_vectors[0] *
        profile_weights[0]
    )

    total_weight = profile_weights[0]

    for index in range(
        1,
        len(profile_vectors)
    ):

        weighted_profile = (
            weighted_profile +
            profile_vectors[index] *
            profile_weights[index]
        )

        total_weight += profile_weights[index]


    if total_weight > 0:
        weighted_profile = (
            weighted_profile /
            total_weight
        )


    # --------------------------------------------------------
    # 6. Compare user profile against all products
    # --------------------------------------------------------

    similarity_scores = cosine_similarity(
        weighted_profile,
        _tfidf_matrix
    ).flatten()


    # --------------------------------------------------------
    # 7. Already interacted products
    # --------------------------------------------------------

    interacted_product_ids = set(
        activities
        and [
            activity.product.id
            for activity in activities
            if activity.product
        ]
    )


    # Also exclude products already recommended
    excluded_ids = (
        interacted_product_ids |
        {
            product.id
            for product in behavior_recommendations
        }
    )


    # --------------------------------------------------------
    # 8. Rank content recommendations
    # --------------------------------------------------------

    ranked_indexes = (
        similarity_scores.argsort()[::-1]
    )

    needed = (
        limit -
        len(behavior_recommendations)
    )

    content_recommendations = []

    for index in ranked_indexes:

        product_id = (
            _tfidf_product_ids[index]
        )

        if product_id in excluded_ids:
            continue

        product = _tfidf_product_map.get(
            product_id
        )

        if not product:
            continue

        content_recommendations.append(
            product
        )

        if len(content_recommendations) >= needed:
            break


    # --------------------------------------------------------
    # 9. Combine behavior + content
    # --------------------------------------------------------

    final_recommendations = (
        behavior_recommendations +
        content_recommendations
    )

    return final_recommendations[:limit]