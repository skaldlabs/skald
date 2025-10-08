from django.contrib import admin

from .models.user import User


class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("username", "email")


admin.site.register(User, CustomUserAdmin)
