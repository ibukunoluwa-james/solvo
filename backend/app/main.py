"""
Solvo Backend — FastAPI Application Factory

Assembles all routers, configures CORS for the Next.js frontend,
and exposes a health check endpoint.
"""

#This is where I start the app, It connect everything else together 

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    companies_router,
    employees_router,
    payroll_router,
    advances_router,
    compliance_router,
)
from app.routers.webhooks import router as webhooks_router

# Ensure all models are imported so Base.metadata knows about them
import app.models  # noqa: F401

logging.basicConfig(
    level=logging.INFO if settings.app_env == "development" else logging.WARNING,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    App lifespan: create tables on startup (dev only), dispose engine on shutdown.
    In production, Alembic migrations handle schema changes.
    """
    if settings.app_env == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created (dev mode)")

    yield

    await engine.dispose()
    logger.info("Database engine disposed")


app = FastAPI(
    title="Solvo API",
    description=(
        "Global payroll engine with automated tax compliance and "
        "emergency advance credit for African workforces. "
        "Powered by Kora API."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth_router)
app.include_router(companies_router)
app.include_router(employees_router)
app.include_router(payroll_router)
app.include_router(advances_router)
app.include_router(compliance_router)
app.include_router(webhooks_router)


# ── Health Check ──
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "solvo-api",
        "version": "0.1.0",
        "kora_mock_mode": settings.kora_mock_mode,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to the Solvo API",
        "docs": "/docs",
        "health": "/health",
    }
