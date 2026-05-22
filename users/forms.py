from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm


class UserRegisterForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=50)
    last_name = forms.CharField(max_length=50)

    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'password1',
            'password2'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        placeholders = {
            "username": "Enter username",
            "first_name": "First name",
            "last_name": "Last name",
            "email": "Enter email",
            "password1": "Enter password",
            "password2": "Confirm password",
        }

        for field_name, field in self.fields.items():

            field.widget.attrs.update({
                "class": (
                    "w-full rounded-2xl "
                    "border border-pink-200 "
                    "bg-pink-50 px-5 py-4 "
                    "focus:outline-none "
                    "focus:ring-2 "
                    "focus:ring-pink-400"
                ),
                "placeholder": placeholders.get(
                    field_name,
                    ""
                )
            })


class UserUpdateForm(forms.ModelForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        placeholders = {
            "username": "Username",
            "first_name": "First name",
            "last_name": "Last name",
            "email": "Email address",
        }

        for field_name, field in self.fields.items():

            field.widget.attrs.update({
                "class": (
                    "w-full rounded-2xl "
                    "border border-pink-200 "
                    "bg-pink-50 px-5 py-4 "
                    "focus:outline-none "
                    "focus:ring-2 "
                    "focus:ring-pink-400"
                ),
                "placeholder": placeholders.get(
                    field_name,
                    ""
                )
            })