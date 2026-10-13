"""
HealthContinuum AI — Core Application Configuration
Loads and validates all settings from environment variables.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configurable settings, loaded from .env / environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ─────────────────────────────────────────────────────────
    app_name: str = "HealthContinuum AI"
    app_env: str = "development"
    debug: bool = False

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./healthcontinuum.db"

    # ── JWT ───────────────────────────────────────────────────────────────────
    jwt_secret_key: str = "CHANGE_ME"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000,http://127.0.0.1:5500,null"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ── Doctor Access Codes ───────────────────────────────────────────────────
    access_code_expire_minutes: int = 20

    # ── Storage ───────────────────────────────────────────────────────────────
    storage_backend: str = "local"
    storage_local_path: str = "./uploads"

    # ── Supabase (optional) ───────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()


settings = get_settings()

