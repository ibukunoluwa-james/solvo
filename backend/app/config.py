"""
Solvo Backend — Application Settings

Uses pydantic-settings to load configuration from environment variables
with a .env file fallback. All secrets and configurable values live here.
"""

#reads our secret .env passwords

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List


class Settings(BaseSettings):
    """Central configuration — loaded from environment / .env file."""

    # ── Database ──
    database_url: str = Field(
        default="postgresql+asyncpg://solvo:solvo_secret@localhost:5432/solvo_db",
        description="Async PostgreSQL connection string",
    )

    # When True, create any missing tables on startup. Convenient for demos /
    # first deploy where no Alembic migration has been run yet. Set to False
    # once migrations own the schema.
    auto_create_tables: bool = True

    # When True, populate the database with demo data on startup IF it is empty.
    # Idempotent (skips if any users already exist), so it is safe to leave on.
    # Intended for demos only — do not enable on a real production database.
    seed_demo_data: bool = False

    @field_validator("database_url")
    @classmethod
    def _force_async_driver(cls, v: str) -> str:
        """
        Managed Postgres providers (Render, Supabase, Neon, Heroku) hand out a
        sync DSN — ``postgres://`` or ``postgresql://``. Our engine is async and
        needs the asyncpg driver, so rewrite the scheme. Also drop libpq-only
        query params (e.g. ``?sslmode=require``) that asyncpg does not accept;
        Render's *internal* URL has none, so this only matters if you paste the
        external URL.
        """
        if v.startswith("postgres://"):
            v = "postgresql+asyncpg://" + v[len("postgres://"):]
        elif v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]
        if v.startswith("postgresql+asyncpg://") and "?" in v:
            v = v.split("?", 1)[0]
        return v

    # ── JWT Auth ──
    secret_key: str = Field(
        default="change-me-in-production",
        description="JWT signing key",
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ── Kora API ──
    kora_api_base_url: str = "https://api.korapay.com/merchant/api/v1"
    kora_api_key: str = ""
    kora_encryption_key: str = ""
    kora_mock_mode: bool = True  # True = simulate Kora responses locally

    # ── App ──
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000,http://localhost:8000"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


# Singleton — import this everywhere
settings = Settings()
