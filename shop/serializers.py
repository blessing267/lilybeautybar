from rest_framework import serializers
from .models import Product, ProductVariant

class ProductVariantSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'colour', 'product_type', 'price', 'stock', 'sku', 'image', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')

            if request:
                return request.build_absolute_uri(
                    obj.image.url
                )

            return obj.image.url

        return None
    
class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    image_url = serializers.SerializerMethodField(read_only=True)

    variants = ProductVariantSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Product
        fields = ['id', 'category', 'subcategory', 'name', 'description', 'price', 'image', 'image_url', 'created_at', 'variants']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            # Return absolute URL if possible
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def _extract_variants(self):
        variants_data = []
        index = 0

        while (
            f"variants[{index}][colour]"
            in self.initial_data
        ):
            variants_data.append({
                "id": self.initial_data.get(
                    f"variants[{index}][id]"
                ),

                "colour": self.initial_data.get(
                    f"variants[{index}][colour]"
                ),

                "product_type": self.initial_data.get(
                    f"variants[{index}][product_type]"
                ),

                "price": self.initial_data.get(
                    f"variants[{index}][price]"
                ),

                "stock": self.initial_data.get(
                    f"variants[{index}][stock]"
                ),

                "image": self.initial_data.get(
                    f"variants[{index}][image]"
                )
            })

            index += 1

        return variants_data

    def create(self, validated_data):
        variants_data = self._extract_variants()

        product = Product.objects.create(
            **validated_data
        )

        for variant_data in variants_data:
            variant_data.pop("id", None)

            ProductVariant.objects.create(
                product=product,
                **variant_data
            )

        return product

    def update(self, instance, validated_data):
        variants_data = self._extract_variants()

        # update product
        instance.name = validated_data.get(
            "name",
            instance.name
        )

        instance.description = validated_data.get(
            "description",
            instance.description
        )

        instance.price = validated_data.get(
            "price",
            instance.price
        )

        if validated_data.get("image"):
            instance.image = validated_data.get(
                "image"
            )

        instance.save()

        existing_ids = []

        for variant_data in variants_data:
            variant_id = variant_data.pop(
                "id",
                None
            )

            image = variant_data.pop(
                "image",
                None
            )

            # EDIT EXISTING VARIANT
            if variant_id:
                try:
                    variant = ProductVariant.objects.get(
                        id=variant_id,
                        product=instance
                    )

                    for key, value in (
                        variant_data.items()
                    ):
                        setattr(
                            variant,
                            key,
                            value
                        )

                    if image:
                        variant.image = image

                    variant.save()

                    existing_ids.append(
                        variant.id
                    )

                except ProductVariant.DoesNotExist:
                    pass

            # CREATE NEW VARIANT
            else:
                variant = ProductVariant.objects.create(
                    product=instance,
                    image=image,
                    **variant_data
                )

                existing_ids.append(
                    variant.id
                )

        # delete removed variants
        instance.variants.exclude(
            id__in=existing_ids
        ).delete()

        return instance