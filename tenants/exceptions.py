class TenantViolation(Exception):
    def __init__(self, message="Tenant violation"):
        self.message = message
        super().__init__(self.message)

class TenantNotFound(TenantViolation):
    pass

class TenantSuspended(TenantViolation):
    pass
