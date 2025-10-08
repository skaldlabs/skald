from django.contrib import admin

from .models import User


class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("username", "email")


admin.site.register(User, CustomUserAdmin)
