from django.db import models
from tenants.models import Tenant, TenantAwareModel

class AccountType(models.TextChoices):
    ASSET = 'ASSET', 'Asset'
    LIABILITY = 'LIABILITY', 'Liability'
    EQUITY = 'EQUITY', 'Equity'
    INCOME = 'INCOME', 'Income'
    EXPENSE = 'EXPENSE', 'Expense'

class Account(TenantAwareModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    account_type = models.CharField(max_length=20, choices=AccountType.choices, default=AccountType.EXPENSE)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('tenant', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"

class JournalEntry(TenantAwareModel):
    date = models.DateField()
    description = models.CharField(max_length=255)
    reference = models.CharField(max_length=100, blank=True) # e.g. Order #123
    posted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} - {self.description}"

class JournalItem(models.Model):
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='items')
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.account.name}: Dr {self.debit} | Cr {self.credit}"

