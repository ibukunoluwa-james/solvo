from app.routers.auth import router as auth_router
from app.routers.companies import router as companies_router
from app.routers.employees import router as employees_router
from app.routers.payroll import router as payroll_router
from app.routers.advances import router as advances_router
from app.routers.compliance import router as compliance_router

__all__ = [
    "auth_router",
    "companies_router",
    "employees_router",
    "payroll_router",
    "advances_router",
    "compliance_router",
]
