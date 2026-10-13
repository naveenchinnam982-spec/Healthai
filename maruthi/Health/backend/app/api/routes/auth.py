"""Supabase Auth integration for patient and doctor profiles.

Passwords and OAuth identities are managed by Supabase Auth. This API only
creates/loads application profiles after the Supabase access token is verified
by the request middleware.
"""
from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import create_access_token, verify_password
from app.database.connection import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class ProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    phone: str | None = Field(default=None, max_length=30)


def _patient_payload(patient: Patient) -> dict[str, Any]:
    return {
        "id": patient.id,
        "name": patient.name,
        "email": patient.email,
        "phone": patient.phone,
        "uhid": patient.uhid,
        "blood_group": patient.blood_group,
        "gender": patient.gender,
        "date_of_birth": patient.date_of_birth,
    }


def _verified_user(request: Request) -> dict[str, Any]:
    user = getattr(request.state, "supabase_user", None)
    if not user or not user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_REQUIRED", "message": "Sign in with Supabase to continue."},
        )
    return user


async def _get_or_create_patient(
    db: AsyncSession, user: dict[str, Any], payload: ProfileRequest | None = None
) -> Patient:
    user_id = str(user["id"])
    metadata = user.get("user_metadata") or {}
    email = user.get("email")
    phone = (payload.phone if payload else None) or user.get("phone") or metadata.get("phone")
    full_name = (
        (payload.full_name if payload else None)
        or metadata.get("full_name")
        or metadata.get("name")
        or (email.split("@", 1)[0].replace(".", " ").replace("_", " ").title() if email else None)
        or "Patient"
    )
    result = await db.execute(select(Patient).where(Patient.owner_id == user_id))
    patient = result.scalar_one_or_none()
    if patient is None:
        patient = Patient(
            id=f"pat-{uuid.uuid4().hex[:12]}",
            owner_id=user_id,
            name=full_name,
            email=email,
            phone=phone,
            uhid=f"HC-{uuid.uuid4().hex[:8].upper()}",
        )
        db.add(patient)
        await db.flush()
    else:
        if payload and payload.full_name:
            patient.name = payload.full_name
        if phone and not patient.phone:
            patient.phone = phone
        if email and not patient.email:
            patient.email = email

    # Keep the Supabase profile row in sync; authorization never trusts editable
    # user_metadata for roles. Patient role is assigned server-side here.
    if db.bind and db.bind.dialect.name == "postgresql":
        await db.execute(
            text(
                "INSERT INTO public.profiles (id, role, full_name, phone) "
                "VALUES (:id, 'patient', :full_name, :phone) "
                "ON CONFLICT (id) DO UPDATE SET "
                "full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name), "
                "phone = COALESCE(EXCLUDED.phone, public.profiles.phone), "
                "updated_at = now()"
            ),
            {"id": user_id, "full_name": full_name, "phone": phone},
        )
    await db.flush()
    await db.refresh(patient)
    return patient


@router.post("/profile")
async def bootstrap_profile(
    payload: ProfileRequest | None = None,
    request: Request = None,  # type: ignore[assignment]
    db: AsyncSession = Depends(get_db),
):
    """Idempotently create/load the patient profile for the verified Supabase user."""
    user = _verified_user(request)
    patient = await _get_or_create_patient(db, user, payload)
    authorization = request.headers.get("Authorization", "")
    token = authorization.partition(" ")[2] if authorization.lower().startswith("bearer ") else ""
    return {
        "success": True,
        "data": {"access_token": token, "token_type": "bearer", "patient": _patient_payload(patient)},
        "message": "Supabase session verified.",
    }


@router.get("/me")
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    user = _verified_user(request)
    result = await db.execute(select(Patient).where(Patient.owner_id == str(user["id"])))
    patient = result.scalar_one_or_none()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROFILE_NOT_FOUND", "message": "Patient profile is not initialized yet."},
        )
    authorization = request.headers.get("Authorization", "")
    token = authorization.partition(" ")[2] if authorization.lower().startswith("bearer ") else ""
    return {
        "success": True,
        "data": {"access_token": token, "token_type": "bearer", "patient": _patient_payload(patient)},
    }


@router.get("/doctor/me")
async def get_current_doctor(request: Request, db: AsyncSession = Depends(get_db)):
    user = _verified_user(request)
    result = await db.execute(
        select(Doctor).where(Doctor.user_id == str(user["id"]), Doctor.is_active.is_(True))
    )
    doctor = result.scalar_one_or_none()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "DOCTOR_PROFILE_REQUIRED", "message": "No active doctor profile is linked to this Supabase account."},
        )
    return {
        "success": True,
        "data": {
            "doctor": {
                "id": doctor.id,
                "fullName": doctor.full_name,
                "credentials": doctor.credentials,
                "registrationNumber": doctor.registration_number,
                "specialty": doctor.specialty,
                "facilityName": doctor.facility_name,
                "facilityId": doctor.facility_id,
                "avatarInitials": doctor.avatar_initials,
                "email": doctor.email,
                "verified": doctor.verified,
            }
        },
    }


# Local doctor login exists only for isolated automated tests. Production sign-in
# must happen through Supabase Auth; this endpoint never issues production JWTs.
class DoctorLoginRequest(BaseModel):
    email: str
    password: str


@router.post("/doctor/login")
async def doctor_login_for_tests(payload: DoctorLoginRequest, db: AsyncSession = Depends(get_db)):
    if settings.app_env.lower() not in {"test", "testing"}:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={"code": "USE_SUPABASE_AUTH", "message": "Doctor sign-in must use Supabase Auth."},
        )
    result = await db.execute(select(Doctor).where(Doctor.email.ilike(payload.email.strip().lower())))
    doctor = result.scalar_one_or_none()
    if not doctor or not doctor.is_active or not doctor.password_hash or not verify_password(payload.password, doctor.password_hash):
        raise HTTPException(status_code=401, detail={"code": "INVALID_CREDENTIALS", "message": "Invalid test doctor credentials."})
    token = create_access_token({"sub": doctor.id, "email": doctor.email, "name": doctor.full_name, "role": "doctor"})
    return {
        "success": True,
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "doctor": {
                "id": doctor.id,
                "fullName": doctor.full_name,
                "credentials": doctor.credentials,
                "registrationNumber": doctor.registration_number,
                "specialty": doctor.specialty,
                "facilityName": doctor.facility_name,
                "facilityId": doctor.facility_id,
                "avatarInitials": doctor.avatar_initials,
                "email": doctor.email,
                "verified": doctor.verified,
            },
        },
        "message": "Test-only doctor session.",
    }


@router.post("/doctor/logout")
async def doctor_logout():
    return {"success": True, "message": "Sign out through Supabase Auth on the client."}
