"""
HealthContinuum AI — Document Routes
Endpoints:
- GET  /api/patients/{patient_id}/documents
- POST /api/patients/{patient_id}/documents (JSON metadata or file)
- POST /api/patients/{patient_id}/documents/upload (multipart/form-data)
- POST /api/documents/upload (multipart/form-data)
- GET  /api/documents/{document_id}
- GET  /api/documents/{document_id}/file (file serving)
- POST /api/documents/{document_id}/review (review & confirmation)
"""
from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.connection import get_db
from app.schemas.schemas import APIResponse, DocumentCreate, DocumentOut, DocumentReviewRequest
from app.services import document_service, patient_service

router = APIRouter(tags=["documents"])

async def _get_patient_for_request(request: Request, db: AsyncSession, patient_id: str):
    patient = await _get_patient_for_request(request, db, patient_id)
    if settings.app_env.lower() not in {"test", "testing"}:
        user = getattr(request.state, "supabase_user", None)
        if not user or str(patient.owner_id or "") != str(user.get("id")):
            raise HTTPException(403, detail={"code": "PATIENT_ACCESS_DENIED", "message": "You do not own this patient's records."})
    return patient



@router.get(
    "/patients/{patient_id}/documents",
    response_model=APIResponse[list[DocumentOut]],
)
async def list_documents(
    patient_id: str,
    document_type: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    patient = await patient_service.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(404, detail={"code": "PATIENT_NOT_FOUND", "message": "Patient not found"})

    docs = await document_service.get_documents_for_patient(
        db, patient_id, document_type=document_type, skip=skip, limit=limit
    )
    return APIResponse(
        success=True,
        data=[DocumentOut.model_validate(d) for d in docs],
        message=f"{len(docs)} documents found",
    )


@router.post(
    "/patients/{patient_id}/documents/upload",
    response_model=APIResponse[DocumentOut],
    status_code=status.HTTP_201_CREATED,
)
async def upload_document_patient(
    patient_id: str,
    request: Request,
    file: UploadFile = File(...),
    document_type: str | None = Form(None),
    visit_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Multipart document upload for a specific patient ID."""
    patient = await patient_service.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(404, detail={"code": "PATIENT_NOT_FOUND", "message": "Patient not found"})

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, detail={"code": "EMPTY_FILE", "message": "Uploaded file is empty"})

    doc = await document_service.upload_and_process_document(
        db=db,
        patient_id=patient_id,
        file_bytes=file_bytes,
        file_name=file.filename or "uploaded_document.pdf",
        content_type=file.content_type or "application/octet-stream",
        hinted_document_type=document_type,
        visit_id=visit_id,
    )

    return APIResponse(
        success=True,
        data=DocumentOut.model_validate(doc),
        message=f"Document '{doc.file_name}' processed successfully with status {doc.processing_status}",
    )


@router.post(
    "/documents/upload",
    response_model=APIResponse[DocumentOut],
    status_code=status.HTTP_201_CREATED,
)
async def upload_document_generic(
    request: Request,
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    document_type: str | None = Form(None),
    visit_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Multipart document upload with patient_id in form."""
    return await upload_document_patient(
        patient_id=patient_id,
        request=request,
        file=file,
        document_type=document_type,
        visit_id=visit_id,
        db=db,
    )



@router.post(
    "/patients/{patient_id}/documents",
    response_model=APIResponse[DocumentOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_document_json(
    patient_id: str,
    payload: DocumentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Standard JSON document creation endpoint."""
    patient = await patient_service.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(404, detail={"code": "PATIENT_NOT_FOUND", "message": "Patient not found"})

    doc = await document_service.create_document(db, patient_id, payload)
    await document_service.document_processing_service.process(doc, db)
    return APIResponse(
        success=True,
        data=DocumentOut.model_validate(doc),
        message="Document record created successfully",
    )


@router.get("/documents/{document_id}", response_model=APIResponse[DocumentOut])
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    doc = await document_service.get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(404, detail={"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})
    return APIResponse(
        success=True,
        data=DocumentOut.model_validate(doc),
        message="Document retrieved successfully",
    )


@router.get("/documents/{document_id}/file")
async def get_document_file(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Serve the original uploaded document file for source inspection."""
    doc = await document_service.get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(404, detail={"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})

    if doc.storage_path:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise HTTPException(503, detail={"code": "STORAGE_NOT_CONFIGURED", "message": "Private Supabase Storage is not configured."})
        encoded_path = quote(doc.storage_path, safe="/")
        sign_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/medical-documents/{encoded_path}"
        key = settings.supabase_service_role_key
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.post(
                    sign_url,
                    json={"expiresIn": 60},
                    headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                )
        except httpx.HTTPError as exc:
            raise HTTPException(503, detail={"code": "STORAGE_UNAVAILABLE", "message": "Could not create a private file link."}) from exc
        if response.status_code not in (200, 201):
            raise HTTPException(502, detail={"code": "STORAGE_SIGN_FAILED", "message": "Could not create a private file link."})
        signed_path = response.json().get("signedURL")
        if not signed_path:
            raise HTTPException(502, detail={"code": "STORAGE_SIGN_FAILED", "message": "Storage returned no signed URL."})
        if signed_path.startswith("http://") or signed_path.startswith("https://"):
            signed_url = signed_path
        else:
            signed_url = settings.supabase_url.rstrip("/") + "/storage/v1" + (signed_path if signed_path.startswith("/") else "/" + signed_path)
        return RedirectResponse(url=signed_url, status_code=307)

    # Local storage is a development/test fallback only. Production startup rejects it.
    patient_dir = Path(settings.storage_local_path) / doc.patient_id
    if not patient_dir.exists():
        raise HTTPException(404, detail={"code": "FILE_NOT_FOUND", "message": "File not found on storage"})
    matching = [p for p in patient_dir.iterdir() if p.name.startswith(doc.id)]
    if not matching:
        raise HTTPException(404, detail={"code": "FILE_NOT_FOUND", "message": "File not found on storage"})
    file_path = matching[0]
    media_type = "application/pdf" if file_path.suffix.lower() == ".pdf" else "image/jpeg" if file_path.suffix.lower() in [".jpg", ".jpeg"] else "image/png" if file_path.suffix.lower() == ".png" else "application/octet-stream"
    return FileResponse(path=str(file_path), media_type=media_type, filename=doc.file_name or file_path.name)

@router.post("/documents/{document_id}/review", response_model=APIResponse[DocumentOut])
async def review_document(
    document_id: str,
    payload: DocumentReviewRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Review and confirm candidate fields extracted from an uploaded document.
    Promotes verified medications and lab results to active clinical continuum.
    """
    doc = await document_service.review_and_confirm_document(db, document_id, payload)
    if not doc:
        raise HTTPException(404, detail={"code": "DOCUMENT_NOT_FOUND", "message": "Document not found"})

    return APIResponse(
        success=True,
        data=DocumentOut.model_validate(doc),
        message=f"Document successfully reviewed and saved as {doc.review_status}",
    )
