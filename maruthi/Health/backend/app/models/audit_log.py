"""
HealthContinuum AI — Audit Log Model
Persistent audit trail for patient record access, PIN redemption, and clinical reviews.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_actor_id", "actor_id"),
        Index("ix_audit_logs_patient_id", "patient_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    actor_id: Mapped[str] = mapped_column(String(36), nullable=False)
    actor_name: Mapped[str] = mapped_column(String(200), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(20), default="doctor")
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # PIN_ATTEMPT | PIN_REDEMPTION | RECORD_VIEW | REVIEW_ACTION | GRANT_REVOKE
    patient_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    patient_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    resource_type: Mapped[str] = mapped_column(String(50), default="shared_access_grant")
    resource_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(100), default="PATIENT_APPROVED_CLINICAL_REVIEW")
    authorization_ref: Mapped[str | None] = mapped_column(String(50), nullable=True)
    outcome: Mapped[str] = mapped_column(String(20), default="success")  # success | denied | error
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id!r} action={self.action!r} actor={self.actor_name!r}>"
