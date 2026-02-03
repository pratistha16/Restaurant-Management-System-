from ninja import NinjaAPI
from tenants.api import router as tenants_router
from accounts.api import router as accounts_router
from accounting.api import router as accounting_router
from pos.api import router as pos_router

api = NinjaAPI(
    title="Restaurant Management System API",
    version="1.0.0",
    description="Multi-tenant Restaurant Management System with Accounting"
)

api.add_router("/tenants", tenants_router)
api.add_router("/accounts", accounts_router)
api.add_router("/accounting", accounting_router)
api.add_router("/pos", pos_router)
