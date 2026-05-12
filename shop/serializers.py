from rest_framework import serializers
from .models import Product, ProductVariant
import json

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'colour', 'product_type', 'price', 'stock', 'sku']

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    image_url = serializers.SerializerMethodField(read_only=True)

    variants = ProductVariantSerializer(many=True, required=False)

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
        variants_data = self.initial_data.get("variants", "[]")

        if isinstance(variants_data, str):
            variants_data = json.loads(variants_data)

        product = Product.objects.create(**validated_data)

        for variant_data in variants_data:
            ProductVariant.objects.create(
                product=product,
                **variant_data
            )

        return product

    def update(self, instance, validated_data):
        variants_data = self.initial_data.get("variants", "[]")

        if isinstance(variants_data, str):
            variants_data = json.loads(variants_data)

        instance.name = validated_data.get(
            'name',
            instance.name
        )

        instance.description = validated_data.get(
            'description',
            instance.description
        )

        instance.price = validated_data.get(
            'price',
            instance.price
        )

        if validated_data.get('image'):
            instance.image = validated_data.get('image')

        instance.save()

        # delete old variants
        instance.variants.all().delete()

        # recreate variants
        for variant_data in variants_data:
            ProductVariant.objects.create(
                product=instance,
                **variant_data
            )

        return instance