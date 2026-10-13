"""
HealthContinuum AI — Patient Routes
GET /api/patients/{patient_id}
GET /api/patients (list, for admin/dev)
POST /api/patients
PATCH /api/patients/{patient_id}
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient

from app.database.connection import get_db
from app.schemas.schemas import (
    APIResponse,
    PatientCreate,
    PatientOut,
    PatientUpdate,
)
from app.services import patient_service

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=APIResponse[list[PatientOut]])
async def list_patients(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    user = getattr(request.state, "supabase_user", None)
    if user:
        result = await db.execute(select(Patient).where(Patient.owner_id == str(user["id"])).offset(skip).limit(limit))
        patients = list(result.scalars().all())
    else:  # Isolated test fixtures only.
        patients = await patient_service.get_all_patients(db, skip=skip, limit=limit)
    return APIResponse(
        success=True,
        data=[PatientOut.model_validate(p) for p in patients],
        message=f"{len(patients)} patients found",
    )


@router.post("", response_model=APIResponse[PatientOut], status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    patient = await patient_service.create_patient(db, payload)
    user = getattr(request.state, "supabase_user", None)
    if user:
        patient.owner_id = str(user["id"])
        await db.flush()
    return APIResponse(
        success=True,
        data=PatientOut.model_validate(patient),
        message="Patient created successfully",
    )


@router.get("/{patient_id}", response_model=APIResponse[PatientOut])
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
):
    patient = await patient_service.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PATIENT_NOT_FOUND", "message": "Patient was not found"},
        )
    return APIResponse(
        success=True,
        data=PatientOut.model_validate(patient),
        message="Patient retrieved successfully",
    )


@router.patch("/{patient_id}", response_model=APIResponse[PatientOut])
async def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    db: AsyncSession = Depends(get_db),
):
    patient = await patient_service.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PATIENT_NOT_FOUND", "message": "Patient was not found"},
        )
    updated = await patient_service.update_patient(db, patient, payload)
    return APIResponse(
        success=True,
        data=PatientOut.model_validate(updated),
        message="Patient updated successfully",
    )
