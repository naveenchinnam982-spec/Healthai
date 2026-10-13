"""
HealthContinuum AI — Document Service
Comprehensive document persistence, file storage, ingestion, and clinical review confirmation.
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.audit_log import AuditLog
from app.models.document import Document
from app.models.lab_result import LabResult
from app.models.medication import Medication
from app.models.patient import Patient
from app.models.visit import Visit
from app.schemas.schemas import DocumentCreate, DocumentReviewRequest
from app.services.extraction_service import extraction_engine


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_upload_dir(patient_id: str) -> Path:
    base_dir = Path(settings.storage_local_path) / patient_id
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir



async def _upload_to_supabase_storage(
    *, owner_id: str, patient_id: str, document_id: str, file_name: str,
    file_bytes: bytes, content_type: str,
) -> str:
    """Upload a medical file to the private Supabase bucket using server-only credentials."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase Storage is not configured on the backend.")
    safe_filename = "".join(c for c in file_name if c.isalnum() or c in (".", "_", "-")).strip() or "document.bin"
    object_path = f"{owner_id}/{patient_id}/{document_id}_{safe_filename}"
    encoded_path = quote(object_path, safe="/")
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/medical-documents/{encoded_path}"
    key = settings.supabase_service_role_key
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(45.0)) as client:
            response = await client.post(
                url,
                content=file_bytes,
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Content-Type": content_type or "application/octet-stream",
                    "x-upsert": "false",
                },
            )
    except httpx.HTTPError as exc:
        raise RuntimeError("Could not connect to Supabase Storage.") from exc
    if response.status_code not in (200, 201):
        raise RuntimeError(f"Supabase Storage rejected the upload (HTTP {response.status_code}).")
    return object_path


def _attach_parsed_data(doc: Document) -> Document:
    """Helper to attach in-memory dict parsed_data from extracted_data JSON string."""
    if doc.extracted_data:
        try:
            doc.parsed_data = json.loads(doc.extracted_data)
        except Exception:
            doc.parsed_data = None
    else:
        doc.parsed_data = None
    return doc


async def get_documents_for_patient(
    db: AsyncSession,
    patient_id: str,
    document_type: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Document]:
    q = select(Document).where(Document.patient_id == patient_id)
    if document_type:
        q = q.where(Document.document_type == document_type.upper())
    q = q.order_by(Document.uploaded_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    docs = list(result.scalars().all())
    for d in docs:
        _attach_parsed_data(d)
    return docs


async def get_document_by_id(db: AsyncSession, document_id: str) -> Document | None:
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if doc:
        _attach_parsed_data(doc)
    return doc


async def create_document(
    db: AsyncSession, patient_id: str, data: DocumentCreate
) -> Document:
    doc = Document(patient_id=patient_id, **data.model_dump())
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return _attach_parsed_data(doc)


async def update_document_status(
    db: AsyncSession,
    document: Document,
    status: str,
    extracted_text: str | None = None,
    extracted_data: dict[str, Any] | None = None,
    confidence_score: float | None = None,
    review_status: str | None = None,
) -> Document:
    """Update processing status, extracted text and structured JSON."""
    document.processing_status = status
    if extracted_text is not None:
        document.extracted_text = extracted_text
    if extracted_data is not None:
        document.extracted_data = json.dumps(extracted_data)
    if confidence_score is not None:
        document.confidence_score = confidence_score
    if review_status is not None:
        document.review_status = review_status

    await db.flush()
    await db.refresh(document)
    return _attach_parsed_data(document)


async def upload_and_process_document(
    db: AsyncSession,
    patient_id: str,
    file_bytes: bytes,
    file_name: str,
    content_type: str = "application/pdf",
    hinted_document_type: str | None = None,
    visit_id: str | None = None,
) -> Document:
    """
    Handle real file upload:
    1. Write file to local disk
    2. Run DocumentExtractionEngine (OCR / PDF extraction / classification / structuring)
    3. Persist Document record in DB with full candidate schema and status
    """
    doc_id = str(uuid.uuid4())
    safe_filename = "".join(c for c in file_name if c.isalnum() or c in (".", "_", "-")).strip() or "document.bin"
    file_url = f"/api/documents/{doc_id}/file"
    storage_path = None

    if settings.storage_backend.lower() == "supabase":
        patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = patient_result.scalar_one_or_none()
        if not patient or not patient.owner_id:
            raise RuntimeError("Patient ownership must be linked to Supabase Auth before uploading files.")
        storage_path = await _upload_to_supabase_storage(
            owner_id=str(patient.owner_id),
            patient_id=patient_id,
            document_id=doc_id,
            file_name=file_name,
            file_bytes=file_bytes,
            content_type=content_type,
        )
    else:
        # Local storage is for development/test only; production startup rejects it.
        upload_dir = _ensure_upload_dir(patient_id)
        disk_filename = f"{doc_id}_{safe_filename}"
        file_path = upload_dir / disk_filename
        with open(file_path, "wb") as f:
            f.write(file_bytes)

    # Run extraction engine on the real file
    extraction_res = extraction_engine.process_document(
        file_bytes=file_bytes,
        file_name=file_name,
        hinted_type=hinted_document_type,
    )

    doc_type = extraction_res["document_type"]
    extracted_text = extraction_res["extracted_text"]
    parsed_data = extraction_res["parsed_data"]
    confidence_score = extraction_res["confidence_score"]
    processing_status = extraction_res["processing_status"]

    doc = Document(
        id=doc_id,
        patient_id=patient_id,
        visit_id=visit_id,
        document_type=doc_type,
        file_name=file_name,
        file_url=file_url,
        storage_path=storage_path,
        processing_status=processing_status,
        extracted_text=extracted_text,
        extracted_data=json.dumps(parsed_data),
        confidence_score=confidence_score,
        review_status="PENDING",
    )
    db.add(doc)

    # Log audit
    audit = AuditLog(
        actor_id=patient_id,
        actor_name=patient_id,
        actor_role="patient",
        action="DOCUMENT_UPLOADED",
        patient_id=patient_id,
        resource_type="document",
        resource_id=doc_id,
        outcome="success",
        detail=f"Uploaded {file_name} ({len(file_bytes)} bytes) as {doc_type}",
    )
    db.add(audit)

    await db.flush()
    await db.refresh(doc)
    return _attach_parsed_data(doc)


async def review_and_confirm_document(
    db: AsyncSession,
    document_id: str,
    payload: DocumentReviewRequest,
) -> Document | None:
    """
    User reviews and confirms candidate fields from an uploaded document.
    Promotes verified medications, lab results, and consultation records to primary DB tables.
    """
    doc = await get_document_by_id(db, document_id)
    if not doc:
        return None

    patient_id = doc.patient_id
    doc_type = payload.document_type or doc.document_type

    # 1. Update Document metadata & status
    doc.document_type = doc_type.upper()
    doc.processing_status = "PROCESSED"
    doc.review_status = payload.status  # "VERIFIED" or "SAVED_WITH_UNRESOLVED"

    # Merge reviewed fields into extracted_data
    existing_data = doc.parsed_data or {}
    existing_data["reviewed_at"] = _now().isoformat()
    existing_data["review_status"] = payload.status
    if payload.document_title:
        existing_data["document_title"] = payload.document_title
    if payload.document_date:
        existing_data["document_date"] = {
            "value": payload.document_date,
            "status": "user_verified",
            "source_text": payload.document_date,
        }
    if payload.hospital_name:
        existing_data["provider_name"] = {
            "value": payload.hospital_name,
            "status": "user_verified",
            "source_text": payload.hospital_name,
        }
    if payload.patient_name:
        existing_data["patient_name"] = {
            "value": payload.patient_name,
            "status": "user_verified",
            "source_text": payload.patient_name,
        }

    # 2. Check/Create Visit association if none
    visit_id = doc.visit_id
    visit_date = payload.document_date or _now().strftime("%Y-%m-%d")
    hosp_name = payload.hospital_name or (existing_data.get("provider_name", {}) if isinstance(existing_data.get("provider_name"), dict) else {}).get("value") or "Clinical Center"
    doc_name = payload.doctor_name or "Attending Physician"

    if not visit_id:
        new_visit = Visit(
            patient_id=patient_id,
            visit_date=visit_date,
            hospital_name=hosp_name,
            doctor_name=doc_name,
            visit_type="Medical Upload Review",
            summary=payload.clinical_notes or f"Reviewed record: {payload.document_title or doc.file_name}",
        )
        db.add(new_visit)
        await db.flush()
        await db.refresh(new_visit)
        visit_id = new_visit.id
        doc.visit_id = visit_id

    # 3. Promote reviewed medications
    if payload.medications:
        existing_data["medications"] = payload.medications
        for med in payload.medications:
            med_name = med.get("name") if isinstance(med.get("name"), str) else (med.get("name", {}) or {}).get("value")
            if not med_name:
                continue
            dose = med.get("dosage") if isinstance(med.get("dosage"), str) else (med.get("dosage", {}) or {}).get("value")
            freq = med.get("frequency") if isinstance(med.get("frequency"), str) else (med.get("frequency", {}) or {}).get("value")
            route = med.get("route") if isinstance(med.get("route"), str) else (med.get("route", {}) or {}).get("value") or "Oral"

            med_obj = Medication(
                patient_id=patient_id,
                visit_id=visit_id,
                source_document_id=doc.id,
                name=med_name,
                dosage=dose,
                frequency=freq,
                route=route,
                status=med.get("status", "CURRENT"),
                start_date=visit_date,
            )
            db.add(med_obj)

    # 4. Promote reviewed lab results
    if payload.lab_results:
        existing_data["results"] = payload.lab_results
        for lab in payload.lab_results:
            tname = lab.get("test_name") if isinstance(lab.get("test_name"), str) else (lab.get("test_name", {}) or {}).get("value")
            if not tname:
                continue
            res_val = lab.get("result") if isinstance(lab.get("result"), str) else (lab.get("result", {}) or {}).get("value")
            unit_val = lab.get("unit") if isinstance(lab.get("unit"), str) else (lab.get("unit", {}) or {}).get("value")
            range_val = lab.get("reference_range") if isinstance(lab.get("reference_range"), str) else (lab.get("reference_range", {}) or {}).get("value")

            lab_obj = LabResult(
                patient_id=patient_id,
                visit_id=visit_id,
                source_document_id=doc.id,
                test_name=tname,
                value=str(res_val) if res_val is not None else None,
                unit=unit_val,
                reference_range=range_val,
                test_date=visit_date,
            )
            db.add(lab_obj)

    # 5. Promote receipts or diagnoses
    if payload.receipt_items:
        existing_data["items"] = payload.receipt_items
    if payload.diagnoses:
        existing_data["diagnoses"] = payload.diagnoses

    doc.extracted_data = json.dumps(existing_data)

    # Log audit
    audit = AuditLog(
        actor_id=patient_id,
        actor_name=patient_id,
        actor_role="patient",
        action="DOCUMENT_REVIEWED_AND_SAVED",
        patient_id=patient_id,
        resource_type="document",
        resource_id=doc.id,
        outcome="success",
        detail=f"Confirmed and verified {doc.file_name} as {doc.document_type} (Status: {doc.review_status})",
    )
    db.add(audit)

    await db.flush()
    await db.refresh(doc)
    return _attach_parsed_data(doc)


class DocumentProcessingService:
    """Document processing pipeline interface."""

    async def process(self, document: Document, db: AsyncSession) -> Document:
        """Trigger document processing pipeline."""
        return await update_document_status(db, document, "PROCESSED")


document_processing_service = DocumentProcessingService()
