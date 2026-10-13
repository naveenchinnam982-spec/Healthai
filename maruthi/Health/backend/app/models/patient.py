"""
HealthContinuum AI — Patient Model
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


OWNER_ID_TYPE = String(36).with_variant(PG_UUID(as_uuid=False), "postgresql")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    owner_id: Mapped[str | None] = mapped_column(OWNER_ID_TYPE, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    date_of_birth: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    uhid: Mapped[str | None] = mapped_column(String(50), nullable=True, unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    # ── Relationships ────────────────────────────────────────────────────────
    visits: Mapped[list["Visit"]] = relationship(  # noqa: F821
        "Visit", back_populates="patient", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(  # noqa: F821
        "Document", back_populates="patient", cascade="all, delete-orphan"
    )
    medications: Mapped[list["Medication"]] = relationship(  # noqa: F821
        "Medication", back_populates="patient", cascade="all, delete-orphan"
    )
    lab_results: Mapped[list["LabResult"]] = relationship(  # noqa: F821
        "LabResult", back_populates="patient", cascade="all, delete-orphan"
    )
    clinical_decisions: Mapped[list["ClinicalDecision"]] = relationship(  # noqa: F821
        "ClinicalDecision", back_populates="patient", cascade="all, delete-orphan"
    )
    change_events: Mapped[list["ChangeEvent"]] = relationship(  # noqa: F821
        "ChangeEvent", back_populates="patient", cascade="all, delete-orphan"
    )
    decision_memories: Mapped[list["DecisionMemory"]] = relationship(  # noqa: F821
        "DecisionMemory", back_populates="patient", cascade="all, delete-orphan"
    )
    doctor_accesses: Mapped[list["DoctorAccess"]] = relationship(  # noqa: F821
        "DoctorAccess", back_populates="patient", cascade="all, delete-orphan"
    )
    conversations: Mapped[list["Conversation"]] = relationship(  # noqa: F821
        "Conversation", back_populates="patient", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Patient id={self.id!r} name={self.name!r}>"
