"""
HealthContinuum AI — Evidence Model
Links supporting documents to a ChangeEvent.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Evidence(Base):
    __tablename__ = "evidences"
    __table_args__ = (
        Index("ix_evidences_patient_id", "patient_id"),
        Index("ix_evidences_related_change_id", "related_change_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    related_change_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("change_events.id", ondelete="CASCADE"), nullable=True
    )
    document_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )

    evidence_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # LAB_REPORT | CLINICAL_NOTE | PRESCRIPTION | SCAN | OTHER
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # ── Relationships ────────────────────────────────────────────────────────
    change_event: Mapped["ChangeEvent | None"] = relationship(  # noqa: F821
        "ChangeEvent", back_populates="evidences"
    )

    def __repr__(self) -> str:
        return f"<Evidence id={self.id!r} type={self.evidence_type!r}>"
