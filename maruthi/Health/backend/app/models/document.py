"""
HealthContinuum AI — Document Model
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_patient_id", "patient_id"),
        Index("ix_documents_document_type", "document_type"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    visit_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("visits.id", ondelete="SET NULL"), nullable=True
    )

    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # Allowed: PRESCRIPTION, LAB_REPORT, SCAN, DOCTOR_NOTE, CLINICAL_NOTE, OTHER

    file_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    storage_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    processing_status: Mapped[str] = mapped_column(
        String(20), default="PENDING", nullable=False
    )
    # Allowed: PENDING, PROCESSING, PROCESSED, FAILED

    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(nullable=True)
    review_status: Mapped[str | None] = mapped_column(String(30), default="PENDING", nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # ── Relationships ────────────────────────────────────────────────────────
    patient: Mapped["Patient"] = relationship("Patient", back_populates="documents")  # noqa: F821
    visit: Mapped["Visit | None"] = relationship("Visit", back_populates="documents")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Document id={self.id!r} type={self.document_type!r} status={self.processing_status!r}>"
