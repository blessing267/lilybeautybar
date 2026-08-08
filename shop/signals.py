import cloudinary.uploader

from django.db.models.signals import (
    pre_save,
    post_save,
    post_delete,
)
from django.dispatch import receiver

from .models import (
    Product,
    ProductVariant,
    ReviewGallery,
)
from users.models import Profile


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def get_cloudinary_public_id(value):
    """
    Return the Cloudinary public ID from a CloudinaryField value.
    """
    if not value:
        return None

    return getattr(value, "public_id", None)


def delete_cloudinary_image(public_id):
    """
    Delete an image permanently from Cloudinary.
    """
    if not public_id:
        return

    cloudinary.uploader.destroy(
        public_id,
        invalidate=True,
        resource_type="image",
    )


def remember_old_cloudinary_image(instance, model):
    """
    Remember the previous image before the model is updated.

    The old image is deleted only AFTER the new model save succeeds.
    """
    if not instance.pk:
        instance._old_cloudinary_image = None
        return

    try:
        old_instance = model.objects.get(pk=instance.pk)
    except model.DoesNotExist:
        instance._old_cloudinary_image = None
        return

    instance._old_cloudinary_image = (
        get_cloudinary_public_id(old_instance.image)
    )


# --------------------------------------------------
# Product
# --------------------------------------------------

@receiver(pre_save, sender=Product)
def product_before_save(sender, instance, **kwargs):
    remember_old_cloudinary_image(
        instance,
        Product,
    )


@receiver(post_save, sender=Product)
def product_after_save(sender, instance, **kwargs):
    old_image = getattr(
        instance,
        "_old_cloudinary_image",
        None,
    )

    new_image = get_cloudinary_public_id(
        instance.image
    )

    if old_image and old_image != new_image:
        delete_cloudinary_image(old_image)


@receiver(post_delete, sender=Product)
def product_after_delete(sender, instance, **kwargs):
    delete_cloudinary_image(
        get_cloudinary_public_id(instance.image)
    )


# --------------------------------------------------
# Product Variant
# --------------------------------------------------

@receiver(pre_save, sender=ProductVariant)
def variant_before_save(sender, instance, **kwargs):
    remember_old_cloudinary_image(
        instance,
        ProductVariant,
    )


@receiver(post_save, sender=ProductVariant)
def variant_after_save(sender, instance, **kwargs):
    old_image = getattr(
        instance,
        "_old_cloudinary_image",
        None,
    )

    new_image = get_cloudinary_public_id(
        instance.image
    )

    if old_image and old_image != new_image:
        delete_cloudinary_image(old_image)


@receiver(post_delete, sender=ProductVariant)
def variant_after_delete(sender, instance, **kwargs):
    delete_cloudinary_image(
        get_cloudinary_public_id(instance.image)
    )


# --------------------------------------------------
# Review Gallery
# --------------------------------------------------

@receiver(pre_save, sender=ReviewGallery)
def review_before_save(sender, instance, **kwargs):
    remember_old_cloudinary_image(
        instance,
        ReviewGallery,
    )


@receiver(post_save, sender=ReviewGallery)
def review_after_save(sender, instance, **kwargs):
    old_image = getattr(
        instance,
        "_old_cloudinary_image",
        None,
    )

    new_image = get_cloudinary_public_id(
        instance.image
    )

    if old_image and old_image != new_image:
        delete_cloudinary_image(old_image)


@receiver(post_delete, sender=ReviewGallery)
def review_after_delete(sender, instance, **kwargs):
    delete_cloudinary_image(
        get_cloudinary_public_id(instance.image)
    )


# --------------------------------------------------
# Profile Picture
# --------------------------------------------------

@receiver(pre_save, sender=Profile)
def profile_before_save(sender, instance, **kwargs):
    if not instance.pk:
        instance._old_profile_image = None
        return

    try:
        old_profile = Profile.objects.get(
            pk=instance.pk
        )
    except Profile.DoesNotExist:
        instance._old_profile_image = None
        return

    instance._old_profile_image = (
        old_profile.image.name
        if old_profile.image
        else None
    )


@receiver(post_save, sender=Profile)
def profile_after_save(sender, instance, **kwargs):
    old_image = getattr(
        instance,
        "_old_profile_image",
        None,
    )

    new_image = (
        instance.image.name
        if instance.image
        else None
    )

    if old_image and old_image != new_image:
        instance.image.storage.delete(
            old_image
        )


@receiver(post_delete, sender=Profile)
def profile_after_delete(sender, instance, **kwargs):
    if instance.image:
        instance.image.storage.delete(
            instance.image.name
        )