from .models import UserActivity


def track_activity(user, product, activity_type, search_query=None):
    UserActivity.objects.create(
        user=user,
        product=product,
        activity_type=activity_type,
        search_query=search_query
    )