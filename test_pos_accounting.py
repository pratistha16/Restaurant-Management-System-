import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rms.settings')
django.setup()

from tenants.models import Tenant, Restaurant
from pos.models import Order, Table, Zone, OrderItem
from menu.models import Item, Category
from accounting.models import JournalEntry, JournalItem, Account
from django.contrib.auth import get_user_model

def test_automation():
    print("Setting up test data...")
    # 1. Create Tenant
    tenant = Tenant.objects.create(name="Test Tenant")
    print(f"Tenant created: {tenant}")

    # 2. Create Restaurant
    restaurant = Restaurant.objects.create(tenant=tenant, name="Test Restaurant")
    print(f"Restaurant created: {restaurant}")

    # 3. Create Zone and Table
    zone = Zone.objects.create(restaurant=restaurant, name="Main Hall")
    table = Table.objects.create(restaurant=restaurant, zone=zone, number="T1")
    print(f"Table created: {table}")

    # 4. Create Order
    order = Order.objects.create(
        restaurant=restaurant,
        table=table,
        status='open',
        total_amount=118.00,
        tax_amount=18.00,
        service_charge_amount=0,
        customer_name="John Doe"
    )
    print(f"Order created: {order} (Status: {order.status})")
    print(f"Order Tenant: {order.tenant} (Should be Test Tenant)")

    # 5. Complete Order (Trigger Signal)
    print("Completing order...")
    order.status = 'completed'
    order.save()
    print(f"Order status updated to: {order.status}")

    # 6. Verify Accounting
    print("Verifying accounting entries...")
    entries = JournalEntry.objects.filter(tenant=tenant, reference=f"Order #{order.id}")
    if entries.exists():
        entry = entries.first()
        print(f"Journal Entry found: {entry}")
        print(f"Posted: {entry.posted}")
        
        items = entry.items.all()
        for item in items:
            print(f"  - {item}")
            
        # Verify amounts
        # Debit Cash 118
        # Credit Sales 100
        # Credit Tax 18
        
        cash_item = items.filter(account__code='1001').first()
        sales_item = items.filter(account__code='4001').first()
        tax_item = items.filter(account__code='2001').first()
        
        if cash_item and cash_item.debit == 118:
            print("  [PASS] Cash Debit Correct")
        else:
            print(f"  [FAIL] Cash Debit Incorrect: {cash_item.debit if cash_item else 'None'}")
            
        if sales_item and sales_item.credit == 100:
             print("  [PASS] Sales Credit Correct")
        else:
             print(f"  [FAIL] Sales Credit Incorrect: {sales_item.credit if sales_item else 'None'}")

        if tax_item and tax_item.credit == 18:
             print("  [PASS] Tax Credit Correct")
        else:
             print(f"  [FAIL] Tax Credit Incorrect: {tax_item.credit if tax_item else 'None'}")
             
    else:
        print("[FAIL] No Journal Entry found!")

if __name__ == "__main__":
    test_automation()
