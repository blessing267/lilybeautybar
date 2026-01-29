from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'image', 'image_url', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            # Return absolute URL if possible
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
