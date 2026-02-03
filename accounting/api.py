from ninja import Router
from typing import List
from .models import Account, JournalEntry
from .schemas import AccountSchema, JournalEntrySchema

router = Router()

@router.get("/accounts", response=List[AccountSchema])
def list_accounts(request):
    return Account.objects.all()

@router.get("/entries", response=List[JournalEntrySchema])
def list_entries(request):
    return JournalEntry.objects.prefetch_related('items', 'items__account').all()
