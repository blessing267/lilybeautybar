from django.db import transaction
from rest_framework import serializers
from .models import Product, ProductVariant

class ProductVariantSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'colour', 'product_type', 'price', 'stock', 'sku', 'image', 'image_url']
        read_only_fields = ["id", "sku", "image_url"]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        
        request = self.context.get('request')

        if request:
            return request.build_absolute_uri(obj.image.url)

        return obj.image.url
    
class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField(read_only=True)

    variants = ProductVariantSerializer(
        many=True,
        read_only=True
    )

    is_on_sale = serializers.BooleanField(
        read_only=True
    )

    current_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Product
        fields = ['id', 'category', 'subcategory', 'name', 'stock', 'description', 'price', "sale_price", "sale_starts_at", "sale_ends_at", "is_on_sale", "current_price", 'image', 'image_url', 'created_at', 'variants']

        read_only_fields = ["id", "image_url", "created_at", "is_on_sale", "current_price",]

        extra_kwargs = {
            "sale_price": {"required": False, "allow_null": True,},
            "sale_starts_at": {"required": False, "allow_null": True,},
            "sale_ends_at": {"required": False, "allow_null": True,},
        }

    def to_internal_value(self, data):
        """
        React FormData sends blank inputs as empty strings.

        Convert empty sale fields to None so that:
        - clearing sale_price ends the sale;
        - clearing dates removes the sale schedule;
        - DRF does not reject an empty decimal or datetime.
        """
        data = data.copy()

        nullable_sale_fields = [
            "sale_price",
            "sale_starts_at",
            "sale_ends_at",
        ]

        for field_name in nullable_sale_fields:
            value = data.get(field_name)

            if value in ("", "null", "undefined"):
                data[field_name] = None

        return super().to_internal_value(data)

    def get_image_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.image.url)

        return obj.image.url

    def validate(self, attrs):
        product_price = attrs.get("price", getattr(self.instance, "price", None))
        sale_price = attrs.get("sale_price", getattr(self.instance, "sale_price", None))
        sale_starts_at = attrs.get("sale_starts_at", getattr(self.instance, "sale_starts_at", None))
        sale_ends_at = attrs.get("sale_ends_at", getattr(self.instance, "sale_ends_at", None))

        # Sale price must be below the original price
        if (
            sale_price is not None
            and product_price is not None
            and sale_price >= product_price
        ):
            raise serializers.ValidationError({
                "sale_price": (
                    "The sale price must be lower "
                    "than the original product price."
                )
            })

        # End date must come after start date
        if (
            sale_starts_at
            and sale_ends_at
            and sale_ends_at <= sale_starts_at
        ):
            raise serializers.ValidationError({
                "sale_ends_at": (
                    "The sale end date must be later "
                    "than the sale start date."
                )
            })
        
        category = attrs.get(
            "category",
            getattr(self.instance, "category", None)
        )

        subcategory = attrs.get(
            "subcategory",
            getattr(self.instance, "subcategory", None)
        )

        if (
            category
            and subcategory
            and subcategory.category_id != category.id
        ):
            raise serializers.ValidationError({
                "subcategory": (
                    "The selected subcategory does not "
                    "belong to the selected category."
                )
            })

        return attrs
    
    def _variants_were_submitted(self):
        """
        Check whether the React form actually included variant fields.

        This prevents existing variants from being deleted when an update
        request changes only the sale price or another product field.
        """
        return any(
            str(key).startswith("variants[")
            for key in self.initial_data.keys()
        )

    def _extract_variants(self): 
        variants_data = []
        index = 0

        while any(
            key in self.initial_data
            for key in [
                f"variants[{index}][id]",
                f"variants[{index}][colour]",
                f"variants[{index}][product_type]",
                f"variants[{index}][price]",
                f"variants[{index}][stock]",
                f"variants[{index}][image]",
            ]
        ):
            variants_data.append({
                "id": self.initial_data.get(f"variants[{index}][id]"),
                "colour": self.initial_data.get(f"variants[{index}][colour]"),
                "product_type": self.initial_data.get(f"variants[{index}][product_type]"),
                "price": self.initial_data.get(f"variants[{index}][price]"),
                "stock": self.initial_data.get(f"variants[{index}][stock]"),
                "image": self.initial_data.get(f"variants[{index}][image]")
            })

            index += 1

        return variants_data

    @transaction.atomic
    def create(self, validated_data):
        variants_data = self._extract_variants()

        product = Product.objects.create(**validated_data)

        for variant_data in variants_data:
            variant_data.pop("id", None)
            ProductVariant.objects.create(product=product, **variant_data)

        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        variants_were_submitted = (
            self._variants_were_submitted()
        )

        variants_data = self._extract_variants()

        # Update ordinary product and sale fields
        editable_fields = [
            "name",
            "description",
            "price",
            "sale_price",
            "sale_starts_at",
            "sale_ends_at",
            "stock",
            "category",
            "subcategory",
        ]

        for field_name in editable_fields:
            if field_name in validated_data:
                setattr(
                    instance,
                    field_name,
                    validated_data[field_name]
                )

        # Update image only when included in the request
        if "image" in validated_data:
            instance.image = validated_data["image"]

        instance.save()

        # Do not touch variants unless React submitted variant data
        if not variants_were_submitted:
            return instance

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

            if variant_id:
                try:
                    variant = ProductVariant.objects.get(
                        id=variant_id,
                        product=instance
                    )
                except ProductVariant.DoesNotExist:
                    continue

                for key, value in variant_data.items():
                    setattr(
                        variant,
                        key,
                        value
                    )

                if image:
                    variant.image = image

                variant.save()
                existing_ids.append(variant.id)

            else:
                variant = ProductVariant.objects.create(
                    product=instance,
                    image=image,
                    **variant_data
                )

                existing_ids.append(variant.id)

        # Delete only variants removed through the React variant form
        instance.variants.exclude(
            id__in=existing_ids
        ).delete()

        return instance
