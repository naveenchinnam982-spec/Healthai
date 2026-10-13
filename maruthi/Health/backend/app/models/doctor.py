"""
HealthContinuum AI — Doctor Model
Authoritative doctor account model with role-based access control.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


USER_ID_TYPE = String(36).with_variant(PG_UUID(as_uuid=False), "postgresql")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Doctor(Base):
    __tablename__ = "doctors"
    __table_args__ = (
        Index("ix_doctors_email", "email"),
        Index("ix_doctors_registration_number", "registration_number"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str | None] = mapped_column(USER_ID_TYPE, nullable=True, unique=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    # Supabase Auth owns passwords; retained only for backwards-compatible local test fixtures.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    credentials: Mapped[str | None] = mapped_column(String(100), default="MD", nullable=True)
    registration_number: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(100), default="General Medicine", nullable=True)
    facility_name: Mapped[str | None] = mapped_column(String(200), default="Continuum Health Centre", nullable=True)
    facility_id: Mapped[str | None] = mapped_column(String(50), nullable=True, default="fac-001")
    avatar_initials: Mapped[str | None] = mapped_column(String(10), default="DR", nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String(20), default="doctor")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    def __repr__(self) -> str:
        return f"<Doctor id={self.id!r} email={self.email!r} name={self.full_name!r}>"
