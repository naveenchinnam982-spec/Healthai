"""
HealthContinuum AI — Doctor Access Service
Manages 20-minute temporary demonstration PIN generation, secure redemption,
audit logging, rate limiting, and patient record access authorization.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import generate_access_code, hash_pin
from app.models.audit_log import AuditLog
from app.models.doctor import Doctor
from app.models.doctor_access import DoctorAccess

settings = get_settings()


async def generate_access(
    db: AsyncSession,
    patient_id: str,
    doctor_name: str | None = None,
    doctor_email: str | None = None,
    scopes: list[str] | None = None,
) -> DoctorAccess:
    """Create a new temporary 20-minute demonstration PIN for a patient."""
    code = generate_access_code(6)
    pin_h = hash_pin(code)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_code_expire_minutes
    )

    access = DoctorAccess(
        patient_id=patient_id,
        code_hash=pin_h,
        doctor_name=doctor_name,
        doctor_email=doctor_email,
        requested_scopes=scopes or ["medical_history", "medications", "reports", "changes", "documents"],
        purpose="DEMO_PURPOSE_ONLY",
        status="ACTIVE",
        attempts=0,
        max_attempts=5,
        expires_at=expires_at,
    )
    setattr(access, "_generated_access_code", code)  # Returned once; never persist the plaintext PIN.
    db.add(access)

    audit = AuditLog(
        actor_id=patient_id,
        actor_name="Patient",
        actor_role="patient",
        action="PIN_GENERATED",
        patient_id=patient_id,
        resource_type="shared_access_grant",
        purpose="DEMO_PURPOSE_ONLY",
        outcome="success",
        detail="Patient generated 20-minute demonstration access PIN.",
    )
    db.add(audit)

    await db.flush()
    await db.commit()
    await db.refresh(access)
    return access


async def verify_access_code(
    db: AsyncSession, code: str
) -> DoctorAccess | None:
    """Return the access record if the code is valid and not expired (auto-expiring if past deadline)."""
    clean_code = code.replace("-", "").replace(" ", "").strip()
    result = await db.execute(
        select(DoctorAccess).where(DoctorAccess.code_hash == hash_pin(clean_code))
    )
    access = result.scalar_one_or_none()
    if access is None:
        return None

    # Auto-expire if past deadline
    now = datetime.now(timezone.utc)
    exp = access.expires_at
    if exp:
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now and access.status in ("PENDING", "ACTIVE"):
            access.status = "EXPIRED"
            await db.commit()

    return access


async def redeem_pin(
    db: AsyncSession,
    code: str,
    doctor: Doctor,
) -> tuple[DoctorAccess | None, str | None]:
    """
    Doctor redeems a 20-minute demonstration PIN.
    Enforces rate limiting (max 5 attempts), checks expiration and revocation,
    and logs every attempt in the audit trail.
    Returns (access, error_code).
    """
    clean_code = code.replace("-", "").replace(" ", "").strip()
    result = await db.execute(
        select(DoctorAccess).where(DoctorAccess.access_code == clean_code)
    )
    access = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    # 1. Invalid PIN check
    if access is None:
        audit = AuditLog(
            actor_id=doctor.id,
            actor_name=doctor.full_name,
            actor_role="doctor",
            action="PIN_ATTEMPT",
            resource_type="shared_access_grant",
            purpose="DEMO_PURPOSE_ONLY",
            outcome="denied",
            detail="Invalid demonstration PIN entered.",
        )
        db.add(audit)
        await db.commit()
        return None, "invalid_pin"

    # 2. Revoked check
    if access.status == "REVOKED":
        audit = AuditLog(
            actor_id=doctor.id,
            actor_name=doctor.full_name,
            actor_role="doctor",
            action="PIN_REDEMPTION",
            patient_id=access.patient_id,
            resource_type="shared_access_grant",
            resource_id=access.id,
            purpose=access.purpose,
            authorization_ref=access.id,
            outcome="denied",
            detail="PIN redemption failed: access grant was revoked by patient.",
        )
        db.add(audit)
        await db.commit()
        return access, "revoked_pin"

    # 3. Lockout / Max attempts check
    if access.attempts >= access.max_attempts:
        audit = AuditLog(
            actor_id=doctor.id,
            actor_name=doctor.full_name,
            actor_role="doctor",
            action="PIN_REDEMPTION",
            patient_id=access.patient_id,
            resource_type="shared_access_grant",
            resource_id=access.id,
            purpose=access.purpose,
            authorization_ref=access.id,
            outcome="denied",
            detail="PIN redemption failed: maximum attempts reached (locked out).",
        )
        db.add(audit)
        await db.commit()
        return access, "locked_out"

    # 4. Expiry check
    exp = access.expires_at
    if exp:
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now or access.status == "EXPIRED":
            access.status = "EXPIRED"
            audit = AuditLog(
                actor_id=doctor.id,
                actor_name=doctor.full_name,
                actor_role="doctor",
                action="PIN_REDEMPTION",
                patient_id=access.patient_id,
                resource_type="shared_access_grant",
                resource_id=access.id,
                purpose=access.purpose,
                authorization_ref=access.id,
                outcome="denied",
                detail="PIN redemption failed: 20-minute demonstration PIN has expired.",
            )
            db.add(audit)
            await db.commit()
            return access, "expired_pin"

    # 5. Success: Increment attempt and grant access
    access.attempts += 1
    access.status = "ACTIVE"
    access.approved_at = now
    access.doctor_id = doctor.id
    access.doctor_name = doctor.full_name
    access.doctor_email = doctor.email

    audit = AuditLog(
        actor_id=doctor.id,
        actor_name=doctor.full_name,
        actor_role="doctor",
        action="PIN_REDEMPTION",
        patient_id=access.patient_id,
        resource_type="shared_access_grant",
        resource_id=access.id,
        purpose=access.purpose,
        authorization_ref=access.id,
        outcome="success",
        detail=f"PIN redeemed successfully. Doctor granted temporary demo access. Scope: {access.requested_scopes}.",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(access)
    return access, None


async def revoke_access(
    db: AsyncSession,
    access_id: str,
    patient_id: str | None = None,
    revoked_by: str = "Patient",
) -> DoctorAccess | None:
    """Revoke an active or pending access grant."""
    stmt = select(DoctorAccess).where(DoctorAccess.id == access_id)
    if patient_id:
        stmt = stmt.where(DoctorAccess.patient_id == patient_id)

    result = await db.execute(stmt)
    access = result.scalar_one_or_none()
    if access is None:
        return None

    now = datetime.now(timezone.utc)
    access.status = "REVOKED"
    access.revoked_at = now
    access.revoked_by = revoked_by

    audit = AuditLog(
        actor_id=access.doctor_id or access.patient_id,
        actor_name=revoked_by,
        actor_role="doctor" if revoked_by != "Patient" else "patient",
        action="GRANT_REVOKE",
        patient_id=access.patient_id,
        resource_type="shared_access_grant",
        resource_id=access.id,
        purpose=access.purpose,
        authorization_ref=access.id,
        outcome="success",
        detail=f"Access grant revoked by {revoked_by}.",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(access)
    return access


async def check_doctor_authorization(
    db: AsyncSession,
    patient_id: str,
    doctor_id: str,
) -> bool:
    """Check if doctor currently holds an active, non-expired, non-revoked grant for patient."""
    now = datetime.now(timezone.utc)
    stmt = select(DoctorAccess).where(
        DoctorAccess.patient_id == patient_id,
        DoctorAccess.status == "ACTIVE",
        DoctorAccess.doctor_id == doctor_id,
    )
    result = await db.execute(stmt)
    grants = result.scalars().all()

    for g in grants:
        exp = g.expires_at
        if exp:
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp > now:
                return True
    return False


async def get_doctor_grants(
    db: AsyncSession,
    doctor_id: str | None = None,
    status_filter: str | None = None,
) -> list[DoctorAccess]:
    """Retrieve grants associated with doctor or all active demo grants."""
    stmt = select(DoctorAccess).order_by(DoctorAccess.created_at.desc())
    if doctor_id:
        stmt = stmt.where(DoctorAccess.doctor_id == doctor_id)
    if status_filter and status_filter != "all":
        stmt = stmt.where(DoctorAccess.status == status_filter.upper())

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_access_records_for_patient(
    db: AsyncSession, patient_id: str
) -> list[DoctorAccess]:
    result = await db.execute(
        select(DoctorAccess)
        .where(DoctorAccess.patient_id == patient_id)
        .order_by(DoctorAccess.created_at.desc())
    )
    return list(result.scalars().all())


async def get_audit_events(
    db: AsyncSession,
    limit: int = 50,
) -> list[AuditLog]:
    """Retrieve the authoritative audit log events."""
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())
