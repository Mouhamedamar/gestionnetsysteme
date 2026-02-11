import urllib.request
import json

try:
    # Test the API
    url = 'http://localhost:8000/api/products/'
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())

    print(f"API Response Status: {response.status}")
    print(f"Number of products: {len(data)}")

    # Check first product with photo
    for product in data:
        if product.get('photo'):
            print(f"\nFirst product with photo: {product['name']}")
            print(f"photo: {product.get('photo')}")
            print(f"photo_url: {product.get('photo_url')}")
            break

    # Check if images are accessible
    if data and data[0].get('photo_url'):
        image_url = f"http://localhost:8000{data[0]['photo_url']}"
        print(f"\nTesting image URL: {image_url}")
        try:
            with urllib.request.urlopen(image_url) as img_response:
                print(f"Image accessible: {img_response.status} - {img_response.headers.get('content-type')}")
        except Exception as e:
            print(f"Image not accessible: {e}")

except Exception as e:
    print(f"Error: {e}")