from ninja import ModelSchema
from .models import Account, JournalEntry, JournalItem

class AccountSchema(ModelSchema):
    class Meta:
        model = Account
        fields = ['id', 'name', 'code', 'account_type', 'is_active']

class JournalItemSchema(ModelSchema):
    account: AccountSchema
    class Meta:
        model = JournalItem
        fields = ['id', 'debit', 'credit']

class JournalEntrySchema(ModelSchema):
    items: list[JournalItemSchema]
    class Meta:
        model = JournalEntry
        fields = ['id', 'date', 'description', 'reference', 'posted', 'created_at']
