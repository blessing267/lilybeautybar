from rest_framework import serializers
from .models import Product, ProductVariant
import uuid

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'colour', 'product_type', 'price', 'stock', 'sku', 'image']

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    image_url = serializers.SerializerMethodField(read_only=True)

    variants = serializers.ListField(required=False, write_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'image', 'image_url', 'created_at', 'variants']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            # Return absolute URL if possible
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def create(self, validated_data):
        variants_data = []

        index = 0

        while f"variants[{index}][colour]" in self.initial_data:
            variants_data.append({
                "colour":
                    self.initial_data.get(
                        f"variants[{index}][colour]"
                    ),

                "product_type":
                    self.initial_data.get(
                        f"variants[{index}][product_type]"
                    ),

                "price":
                    self.initial_data.get(
                        f"variants[{index}][price]"
                    ),

                "stock":
                    self.initial_data.get(
                        f"variants[{index}][stock]"
                    ),

                "sku":
                    self.initial_data.get(
                        f"variants[{index}][sku]"
                    )or f"SKU-{uuid.uuid4().hex[:8].upper()}",

                "image":
                    self.initial_data.get(
                        f"variants[{index}][image]"
                    )
            })

            index += 1

        product = Product.objects.create(**validated_data)

        for variant_data in variants_data:
            ProductVariant.objects.create(
                product=product,
                **variant_data
            )

        return product

    def update(self, instance, validated_data):
            variants_data = []

            index = 0

            while f"variants[{index}][colour]" in self.initial_data:
                variants_data.append({
                    "colour":
                        self.initial_data.get(
                            f"variants[{index}][colour]"
                        ),

                    "product_type":
                        self.initial_data.get(
                            f"variants[{index}][product_type]"
                        ),

                    "price":
                        self.initial_data.get(
                            f"variants[{index}][price]"
                        ),

                    "stock":
                        self.initial_data.get(
                            f"variants[{index}][stock]"
                        ),

                    "sku":
                        self.initial_data.get(
                            f"variants[{index}][sku]"
                        ),

                    "image":
                        self.initial_data.get(
                            f"variants[{index}][image]"
                        )
                })

                index += 1

            # update product fields
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

            # remove old variants
            instance.variants.all().delete()

            # recreate variants
            for variant_data in variants_data:
                ProductVariant.objects.create(
                    product=instance,
                 **variant_data
                )

            return instance