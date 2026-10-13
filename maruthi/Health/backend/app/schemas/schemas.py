"""
HealthContinuum AI — Pydantic Schemas

All request/response models with field validation.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, EmailStr, Field, field_validator

# ══════════════════════════════════════════════════════════════════════════════
# GENERIC API RESPONSE WRAPPER
# ══════════════════════════════════════════════════════════════════════════════

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    message: str | None = None


class APIError(BaseModel):
    code: str
    message: str


class APIErrorResponse(BaseModel):
    success: bool = False
    error: APIError


# ══════════════════════════════════════════════════════════════════════════════
# PATIENT
# ══════════════════════════════════════════════════════════════════════════════

class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    date_of_birth: str | None = None
    gender: str | None = None
    blood_group: str | None = None
    phone: str | None = None
    email: str | None = None
    uhid: str | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    blood_group: str | None = None
    phone: str | None = None
    email: str | None = None


class PatientOut(PatientBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# VISIT
# ══════════════════════════════════════════════════════════════════════════════

class VisitBase(BaseModel):
    visit_date: str = Field(..., min_length=1)
    hospital_name: str | None = None
    doctor_name: str | None = None
    visit_type: str | None = None
    summary: str | None = None


class VisitCreate(VisitBase):
    pass


class VisitOut(VisitBase):
    id: str
    patient_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT
# ══════════════════════════════════════════════════════════════════════════════

VALID_DOCUMENT_TYPES = {
    "PRESCRIPTION", "LAB_REPORT", "SCAN",
    "DOCTOR_NOTE", "CLINICAL_NOTE", "OTHER",
}

VALID_PROCESSING_STATUSES = {"PENDING", "PROCESSING", "PROCESSED", "FAILED"}


class DocumentCreate(BaseModel):
    visit_id: str | None = None
    document_type: str = Field(..., min_length=1)
    file_name: str | None = None

    @field_validator("document_type")
    @classmethod
    def validate_document_type(cls, v: str) -> str:
        v = v.upper()
        if v not in VALID_DOCUMENT_TYPES:
            raise ValueError(f"document_type must be one of {VALID_DOCUMENT_TYPES}")
        return v


class DocumentOut(BaseModel):
    id: str
    patient_id: str
    visit_id: str | None
    document_type: str
    file_name: str | None
    file_url: str | None
    processing_status: str
    extracted_text: str | None = None
    extracted_data: str | None = None
    parsed_data: dict | None = None
    confidence_score: float | None = None
    review_status: str | None = "PENDING"
    uploaded_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentReviewRequest(BaseModel):
    document_type: str | None = None
    document_title: str | None = None
    document_date: str | None = None
    hospital_name: str | None = None
    doctor_name: str | None = None
    patient_name: str | None = None
    medications: list[dict] | None = None
    lab_results: list[dict] | None = None
    diagnoses: list[str] | None = None
    clinical_notes: str | None = None
    receipt_items: list[dict] | None = None
    total_amount: str | None = None
    save_unresolved: bool = False
    status: str = "VERIFIED"



# ══════════════════════════════════════════════════════════════════════════════
# MEDICATION
# ══════════════════════════════════════════════════════════════════════════════

class MedicationCreate(BaseModel):
    visit_id: str | None = None
    name: str = Field(..., min_length=1)
    dosage: str | None = None
    frequency: str | None = None
    route: str | None = None
    status: str = "CURRENT"
    start_date: str | None = None
    end_date: str | None = None


class MedicationOut(BaseModel):
    id: str
    patient_id: str
    visit_id: str | None
    name: str
    dosage: str | None
    frequency: str | None
    route: str | None
    status: str
    start_date: str | None
    end_date: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# LAB RESULT
# ══════════════════════════════════════════════════════════════════════════════

class LabResultCreate(BaseModel):
    visit_id: str | None = None
    test_name: str = Field(..., min_length=1)
    value: str | None = None
    unit: str | None = None
    reference_range: str | None = None
    test_date: str | None = None


class LabResultOut(BaseModel):
    id: str
    patient_id: str
    visit_id: str | None
    test_name: str
    value: str | None
    unit: str | None
    reference_range: str | None
    test_date: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# CLINICAL DECISION
# ══════════════════════════════════════════════════════════════════════════════

class ClinicalDecisionOut(BaseModel):
    id: str
    patient_id: str
    visit_id: str | None
    decision: str
    reason: str | None
    confidence: float | None
    verification_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# CHANGE EVENT
# ══════════════════════════════════════════════════════════════════════════════

class ChangeEventOut(BaseModel):
    id: str
    patient_id: str
    previous_visit_id: str | None
    current_visit_id: str | None
    change_type: str
    field_name: str | None
    previous_value: str | None
    current_value: str | None
    reason_status: str
    evidence_status: str
    review_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# EVIDENCE
# ══════════════════════════════════════════════════════════════════════════════

class EvidenceOut(BaseModel):
    id: str
    patient_id: str
    related_change_id: str | None
    document_id: str | None
    evidence_type: str | None
    description: str | None
    confidence: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# DOCTOR ACCESS
# ══════════════════════════════════════════════════════════════════════════════

class GenerateAccessCodeRequest(BaseModel):
    patient_id: str
    doctor_name: str | None = None
    doctor_email: str | None = None
    requested_scopes: list[str] = Field(
        default=["medical_history", "medications", "reports", "changes"]
    )


class GenerateAccessCodeOut(BaseModel):
    id: str
    access_code: str
    expires_at: datetime
    status: str
    purpose: str = "PATIENT_APPROVED_CLINICAL_REVIEW"
    expires_in_seconds: int = 1200

    model_config = {"from_attributes": True}


class VerifyAccessCodeRequest(BaseModel):
    access_code: str

    @field_validator("access_code")
    @classmethod
    def clean_pin(cls, v: str) -> str:
        cleaned = v.replace("-", "").replace(" ", "").strip()
        if len(cleaned) != 6 or not cleaned.isdigit():
            raise ValueError("PIN must be exactly 6 numeric digits")
        return cleaned


class VerifyAccessCodeOut(BaseModel):
    id: str
    patient_id: str
    doctor_name: str | None
    requested_scopes: list[str] = Field(default_factory=list)
    status: str
    expires_at: datetime
    purpose: str = "PATIENT_APPROVED_CLINICAL_REVIEW"

    model_config = {"from_attributes": True}


class RedeemPinOut(BaseModel):
    success: bool
    grant: dict[str, Any]
    patient: dict[str, Any]
    message: str | None = None


class ApproveAccessRequest(BaseModel):
    access_id: str


class RevokeAccessRequest(BaseModel):
    access_id: str
    patient_id: str | None = None


class DoctorReviewActionRequest(BaseModel):
    item_id: str
    action: str  # confirmed | needs_clarification | not_applicable
    note: str
    patient_id: str | None = None


class AuditLogOut(BaseModel):
    id: str
    actor_id: str
    actor_name: str
    actor_role: str
    action: str
    patient_id: str | None = None
    patient_name: str | None = None
    resource_type: str
    resource_id: str | None = None
    purpose: str | None = None
    outcome: str
    detail: str
    timestamp: str

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# DECISION MEMORY
# ══════════════════════════════════════════════════════════════════════════════

class DecisionMemoryOut(BaseModel):
    id: str
    patient_id: str
    source_visit_id: str | None
    finding: str | None
    decision: str
    reason: str | None
    evidence: str | None
    follow_up: str | None
    verification_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH SUMMARY (Home screen aggregation)
# ══════════════════════════════════════════════════════════════════════════════

class HealthSummary(BaseModel):
    patient: PatientOut
    total_visits: int
    latest_visit: VisitOut | None
    unresolved_changes: int
    pending_review: int
    recent_activity: list[dict[str, Any]]


# ══════════════════════════════════════════════════════════════════════════════
# COMPANION & CONVERSATION PERSISTENCE
# ══════════════════════════════════════════════════════════════════════════════

class CitationSource(BaseModel):
    title: str
    date: str | None = None
    type: str  # LAB_REPORT, PRESCRIPTION, CLINICAL_NOTE, VISIT, EXTERNAL_GUIDELINE, etc.
    doc_id: str | None = None
    field_name: str | None = None
    value: str | None = None
    uncertainty_flag: bool = False
    is_external_knowledge: bool = False


class ChatMessageRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=3000)
    conversation_id: str | None = None
    language: str = "en"  # "en" or "te"


class ChatMessageResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    language: str
    intent: str
    citations: list[CitationSource] = []
    safety_status: str  # SAFE, EMERGENCY_ESCALATION, UNREADABLE_PRESCRIPTION, INSUFFICIENT_EVIDENCE, OUT_OF_SCOPE
    uncertainty_notes: str | None = None
    suggested_next_actions: list[str] = []
    provider: str
    provider_note: str | None = None
    documented_facts: list[str] = []


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    patient_id: str
    role: str
    content: str
    intent: str | None = None
    language: str = "en"
    citations: list[dict[str, Any]] = []
    safety_status: str = "SAFE"
    uncertainty_notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: str
    patient_id: str
    title: str
    language: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut] = []

    model_config = {"from_attributes": True}

