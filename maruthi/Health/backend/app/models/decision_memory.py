"""
HealthContinuum AI — Decision Memory Model

Stores the final verified decision chain:
Test → Finding → Decision → Reason → Follow-up
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class DecisionMemory(Base):
    __tablename__ = "decision_memories"
    __table_args__ = (
        Index("ix_decision_memories_patient_id", "patient_id"),
        Index("ix_decision_memories_verification_status", "verification_status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    source_visit_id: Mapped[str | None] = mapped_column(
        "visit_id", String(36), ForeignKey("visits.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON().with_variant(JSONB(), "postgresql"), default=dict, nullable=False)

    finding: Mapped[str | None] = mapped_column(Text, nullable=True)
    decision: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)
    follow_up: Mapped[str | None] = mapped_column(Text, nullable=True)

    verification_status: Mapped[str] = mapped_column(
        String(20), default="PENDING", nullable=False
    )
    # PENDING | VERIFIED | REQUIRES_REVIEW

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # ── Relationships ────────────────────────────────────────────────────────
    patient: Mapped["Patient"] = relationship("Patient", back_populates="decision_memories")  # noqa: F821

    def __repr__(self) -> str:
        return f"<DecisionMemory id={self.id!r} decision={self.decision[:40]!r}>"
