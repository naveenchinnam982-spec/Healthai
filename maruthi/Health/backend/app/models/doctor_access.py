"""
HealthContinuum AI — Doctor Access Model
Temporary 20-minute demonstration PIN and access grant system for secure patient-to-doctor sharing.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class DoctorAccess(Base):
    __tablename__ = "doctor_accesses"
    __table_args__ = (
        Index("ix_doctor_accesses_patient_id", "patient_id"),
        Index("ix_doctor_accesses_access_code", "access_code"),
        Index("ix_doctor_accesses_status", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )

    code_hash: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    doctor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    doctor_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    doctor_email: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # What information the doctor requested / was granted access to
    requested_scopes: Mapped[list[str]] = mapped_column(
        "scope", JSONB().with_variant(JSON(), "sqlite"), nullable=False,
        default=lambda: ["medical_history", "medications", "reports", "changes", "documents"]
    )

    purpose: Mapped[str] = mapped_column(String(100), default="DEMO_PURPOSE_ONLY", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    # PENDING | APPROVED | DECLINED | EXPIRED | REVOKED

    attempts: Mapped[int] = mapped_column("attempts_used", Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    doctor_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    doctor_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # ── Relationships ────────────────────────────────────────────────────────
    patient: Mapped["Patient"] = relationship("Patient", back_populates="doctor_accesses")  # noqa: F821

    def __repr__(self) -> str:
        return f"<DoctorAccess id={self.id!r} status={self.status!r}>"


class ReviewQueueItem(Base):
    __tablename__ = "review_queue_items"
    __table_args__ = (
        Index("ix_review_queue_patient_id", "patient_id"),
        Index("ix_review_queue_status", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    access_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    document_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    document_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    change_event_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    item_type: Mapped[str] = mapped_column(String(50), default="PRESCRIPTION_HANDWRITING")
    field_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    candidate_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    uncertainty_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    patient_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    doctor_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    priority: Mapped[str] = mapped_column(String(20), default="ROUTINE")
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    def __repr__(self) -> str:
        return f"<ReviewQueueItem id={self.id!r} title={self.title!r} status={self.status!r}>"

