from django.contrib import admin
from .models import UserActivity


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "product",
        "activity_type",
        "timestamp",
    )

    list_filter = ("activity_type",)
    search_fields = (
        "user__username",
        "product__name",
    )