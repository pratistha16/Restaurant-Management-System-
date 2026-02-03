from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from pos.models import Order
from accounting.models import JournalEntry, JournalItem, Account, AccountType

def get_or_create_account(tenant, name, code, account_type):
    account, created = Account.objects.get_or_create(
        tenant=tenant,
        code=code,
        defaults={
            'name': name,
            'account_type': account_type,
            'is_active': True
        }
    )
    return account

@receiver(post_save, sender=Order)
def create_order_journal_entry(sender, instance, created, **kwargs):
    """
    Automatically create Journal Entry when an Order is completed.
    """
    order = instance
    
    # Only process if order is completed
    if order.status != 'completed':
        return

    # Check if entry already exists to avoid duplicates
    reference = f"Order #{order.id}"
    if JournalEntry.objects.filter(tenant=order.tenant, reference=reference).exists():
        return

    # We need a tenant context. Order has tenant.
    tenant = order.tenant
    
    # Get Accounts (Create defaults if not exist)
    # Asset: Cash/Bank
    # Income: Sales
    # Liability: Tax
    # Income: Service Charge
    
    # Determine Asset Account based on payment method (simplified for now, default to Cash)
    # ideally we check order.payments
    asset_account = get_or_create_account(tenant, "Cash on Hand", "1001", AccountType.ASSET)
    sales_account = get_or_create_account(tenant, "Sales Revenue", "4001", AccountType.INCOME)
    tax_account = get_or_create_account(tenant, "Tax Payable", "2001", AccountType.LIABILITY)
    service_charge_account = get_or_create_account(tenant, "Service Charge Revenue", "4002", AccountType.INCOME)

    # Calculate amounts
    total_amount = order.total_amount
    tax_amount = order.tax_amount
    service_charge_amount = order.service_charge_amount
    
    # Sales amount excludes tax and service charge? 
    # Usually total = sales + tax + service_charge - discount
    # Let's assume order.total_amount is the final payable.
    # We need to know the base amount.
    # order doesn't explicitly store "subtotal after discount".
    # But usually: Total = (Subtotal - Discount) + Tax + Service
    # So Sales (Net) = Total - Tax - Service
    
    # Note: If discount is applied, it reduces Sales or is a separate expense?
    # Usually Net Sales.
    
    net_sales = total_amount - tax_amount - service_charge_amount
    
    if net_sales < 0:
        # Should not happen unless data issue
        net_sales = 0

    with transaction.atomic():
        # Create Journal Entry
        entry = JournalEntry.objects.create(
            tenant=tenant,
            date=order.updated_at.date(), # Use completion date
            description=f"Sales from Order #{order.id}",
            reference=reference,
            posted=True
        )
        
        # Debit Asset (Cash)
        JournalItem.objects.create(
            entry=entry,
            account=asset_account,
            debit=total_amount,
            credit=0
        )
        
        # Credit Sales
        if net_sales > 0:
            JournalItem.objects.create(
                entry=entry,
                account=sales_account,
                debit=0,
                credit=net_sales
            )
            
        # Credit Tax
        if tax_amount > 0:
            JournalItem.objects.create(
                entry=entry,
                account=tax_account,
                debit=0,
                credit=tax_amount
            )
            
        # Credit Service Charge
        if service_charge_amount > 0:
            JournalItem.objects.create(
                entry=entry,
                account=service_charge_account,
                debit=0,
                credit=service_charge_amount
            )
