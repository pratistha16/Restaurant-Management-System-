import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from django.test import Client
import json

def test_api():
    client = Client()
    
    print("Testing API...")
    
    # 1. List Zones
    response = client.get('/api/v2/pos/zones')
    print(f"GET /pos/zones: {response.status_code}")
    if response.status_code == 200:
        print(response.json())
        
    # 2. List Tables
    response = client.get('/api/v2/pos/tables')
    print(f"GET /pos/tables: {response.status_code}")
    if response.status_code == 200:
        print(response.json())
        
    # 3. List Orders
    response = client.get('/api/v2/pos/orders')
    print(f"GET /pos/orders: {response.status_code}")
    if response.status_code == 200:
        orders = response.json()
        print(f"Found {len(orders)} orders")
        if len(orders) > 0:
            print(orders[0])

if __name__ == "__main__":
    test_api()
