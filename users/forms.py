from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from .models import Profile


INPUT_CLASSES = """
w-full rounded-xl
border border-gray-300
bg-white px-4 py-3
text-gray-900
outline-none transition
placeholder:text-gray-400
focus:border-pink-500
focus:ring-4
focus:ring-pink-100
""".strip()


REGISTER_INPUT_CLASSES = """
w-full rounded-2xl
border border-pink-200
bg-pink-50 px-5 py-4
focus:outline-none
focus:ring-2
focus:ring-pink-400
""".strip()


class UserRegisterForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
    )

    first_name = forms.CharField(
        max_length=50,
        required=True,
    )

    last_name = forms.CharField(
        max_length=50,
        required=True,
    )

    phone = forms.CharField(
        max_length=20,
        required=True,
    )

    class Meta:
        model = User

        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "password1",
            "password2",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        placeholders = {
            "username": "Enter username",
            "first_name": "First name",
            "last_name": "Last name",
            "email": "Enter email",
            "phone": "Enter phone number",
            "password1": "Enter password",
            "password2": "Confirm password",
        }

        for field_name, field in self.fields.items():
            field.widget.attrs.update(
                {
                    "class": REGISTER_INPUT_CLASSES,
                    "placeholder": placeholders.get(
                        field_name,
                        "",
                    ),
                }
            )

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()

        if User.objects.filter(
            email__iexact=email
        ).exists():
            raise forms.ValidationError(
                "An account with this email address already exists."
            )

        return email

    def clean_phone(self):
        phone = self.cleaned_data["phone"].strip()

        if len(phone) < 7:
            raise forms.ValidationError(
                "Enter a valid phone number."
            )

        return phone

    def save(self, commit=True):
        user = super().save(
            commit=False
        )

        user.email = self.cleaned_data["email"]
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]

        if commit:
            user.save()

            profile, created = Profile.objects.get_or_create(
                user=user
            )

            profile.phone = self.cleaned_data["phone"]
            profile.save()

        return user


class UserUpdateForm(forms.ModelForm):
    phone = forms.CharField(
        max_length=20,
        required=False,
        widget=forms.TextInput(
            attrs={
                "class": INPUT_CLASSES,
                "placeholder": "Enter your phone number",
            }
        ),
    )

    class Meta:
        model = User

        fields = [
            "first_name",
            "last_name",
            "username",
            "email",
            "phone",
        ]

        widgets = {
            "first_name": forms.TextInput(
                attrs={
                    "class": INPUT_CLASSES,
                    "placeholder": "Enter your first name",
                }
            ),

            "last_name": forms.TextInput(
                attrs={
                    "class": INPUT_CLASSES,
                    "placeholder": "Enter your last name",
                }
            ),

            "username": forms.TextInput(
                attrs={
                    "class": INPUT_CLASSES,
                    "placeholder": "Enter your username",
                }
            ),

            "email": forms.EmailInput(
                attrs={
                    "class": INPUT_CLASSES,
                    "placeholder": "Enter your email address",
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.pk:
            profile, created = Profile.objects.get_or_create(
                user=self.instance
            )

            self.fields["phone"].initial = profile.phone

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()

        existing_user = (
            User.objects
            .filter(email__iexact=email)
            .exclude(pk=self.instance.pk)
            .exists()
        )

        if existing_user:
            raise forms.ValidationError(
                "Another account is already using this email address."
            )

        return email

    def clean_phone(self):
        phone = self.cleaned_data.get(
            "phone",
            "",
        ).strip()

        if phone and len(phone) < 7:
            raise forms.ValidationError(
                "Enter a valid phone number."
            )

        return phone

    def save(self, commit=True):
        user = super().save(
            commit=commit
        )

        if commit:
            profile, created = Profile.objects.get_or_create(
                user=user
            )

            profile.phone = self.cleaned_data.get(
                "phone",
                "",
            )

            profile.save()

        return user