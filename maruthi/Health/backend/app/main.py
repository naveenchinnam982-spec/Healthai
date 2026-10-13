"""
HealthContinuum AI — FastAPI Application Entry Point
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from pathlib import Path
import re
from urllib.parse import unquote

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.api.routes import (
    auth,
    changes,
    companion,
    decisions,
    decision_memory,
    doctor_access,
    documents,
    labs,
    medications,
    patients,
    summary,
    visits,
)
from app.core.config import get_settings
from app.database.connection import AsyncSessionLocal, create_all_tables
from app.core.supabase_auth import bearer_token, verify_supabase_access_token
from app.models.patient import Patient
from app.models.document import Document
from app.models.change_event import ChangeEvent
from app.models.doctor import Doctor
from app.models.doctor_access import DoctorAccess, ReviewQueueItem
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthcontinuum")

settings = get_settings()


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables. Shutdown: clean up."""
    logger.info("Starting HealthContinuum AI backend...")
    if settings.app_env.lower() in {"production", "prod"}:
        if not settings.database_url.startswith("postgresql+asyncpg://"):
            raise RuntimeError("Production requires DATABASE_URL pointing to Supabase PostgreSQL; SQLite is not allowed.")
        if not settings.supabase_url or not settings.supabase_anon_key:
            raise RuntimeError("Production requires SUPABASE_URL and SUPABASE_ANON_KEY for Supabase Auth verification.")
        if settings.storage_backend.lower() != "supabase" or not settings.supabase_service_role_key:
            raise RuntimeError("Production requires STORAGE_BACKEND=supabase and a server-only SUPABASE_SERVICE_ROLE_KEY.")
        if settings.debug:
            raise RuntimeError("DEBUG must be false in production.")
        if not settings.allowed_origins or any(origin == "null" or origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1") for origin in settings.cors_origins):
            raise RuntimeError("Production ALLOWED_ORIGINS must contain only explicit deployed HTTPS origins.")
        logger.info("Production schema must be managed by versioned SQL migrations; automatic create_all is disabled.")
    else:
        await create_all_tables()
        logger.info("Development/test database tables verified.")
    yield
    logger.info("HealthContinuum AI backend shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="HealthContinuum AI",
    description=(
        "Understand what changed. Know why. Close the gap.\n\n"
        "Backend API for the patient-facing health continuity platform."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Supabase Auth + patient ownership boundary ─────────────────────────────────
LEGACY_AUTH_PATHS = {
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google",
    "/api/auth/doctor/login",
}


@app.middleware("http")
async def require_supabase_session_and_ownership(request: Request, call_next):
    path = request.url.path
    if request.method == "OPTIONS" or not path.startswith("/api/"):
        return await call_next(request)
    if path in {"/api/health", "/api/config", "/api/docs", "/api/redoc", "/api/openapi.json"}:
        return await call_next(request)
    if path in LEGACY_AUTH_PATHS:
        return JSONResponse(
            status_code=410,
            content={"success": False, "error": {"code": "USE_SUPABASE_AUTH", "message": "Use Supabase Auth for sign-in and registration."}},
        )
    # Existing unit/integration tests use an isolated in-memory database and explicit fixtures.
    # This bypass is enabled only by the test runner's APP_ENV=test setting.
    if settings.app_env.lower() in {"test", "testing"}:
        return await call_next(request)

    token = bearer_token(request)
    if not token:
        return JSONResponse(
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"},
            content={"success": False, "error": {"code": "AUTH_REQUIRED", "message": "Please sign in to access patient records."}},
        )
    try:
        user = await verify_supabase_access_token(token)
    except Exception as exc:
        from fastapi import HTTPException
        if isinstance(exc, HTTPException):
            return JSONResponse(status_code=exc.status_code, headers=exc.headers or {}, content={"success": False, "error": exc.detail})
        logger.exception("Supabase session verification failed")
        return JSONResponse(status_code=503, content={"success": False, "error": {"code": "AUTH_UNAVAILABLE", "message": "Could not verify the Supabase session."}})
    request.state.supabase_user = user
    user_id = str(user["id"])

    # The API uses a server-side PostgreSQL connection, which bypasses RLS. Enforce
    # ownership here before any route can read or mutate a patient's records.
    try:
        async with AsyncSessionLocal() as db:
            patient_match = re.match(r"^/api/patients/([^/]+)(?:/.*)?$", path)
            if patient_match:
                patient_id = unquote(patient_match.group(1))
                owned = await db.execute(select(Patient.id).where(Patient.id == patient_id, Patient.owner_id == user_id))
                if owned.scalar_one_or_none() is None:
                    return JSONResponse(status_code=403, content={"success": False, "error": {"code": "PATIENT_ACCESS_DENIED", "message": "You do not have access to this patient's records."}})

            document_match = re.match(r"^/api/documents/([^/]+)(?:/.*)?$", path)
            if document_match and document_match.group(1) != "upload":
                document_id = unquote(document_match.group(1))
                result = await db.execute(select(Document.patient_id).where(Document.id == document_id))
                patient_id = result.scalar_one_or_none()
                if patient_id is not None:
                    owned = await db.execute(select(Patient.id).where(Patient.id == patient_id, Patient.owner_id == user_id))
                    if owned.scalar_one_or_none() is None:
                        return JSONResponse(status_code=403, content={"success": False, "error": {"code": "DOCUMENT_ACCESS_DENIED", "message": "You do not have access to this document."}})

            change_match = re.match(r"^/api/changes/([^/]+)(?:/.*)?$", path)
            if change_match:
                change_id = unquote(change_match.group(1))
                result = await db.execute(select(ChangeEvent.patient_id).where(ChangeEvent.id == change_id))
                patient_id = result.scalar_one_or_none()
                if patient_id is not None:
                    owned = await db.execute(select(Patient.id).where(Patient.id == patient_id, Patient.owner_id == user_id))
                    if owned.scalar_one_or_none() is None:
                        return JSONResponse(status_code=403, content={"success": False, "error": {"code": "CHANGE_ACCESS_DENIED", "message": "You do not have access to this patient's change records."}})

            # Patient-owned doctor-access history is protected by the patient owner.
            reserved = {"generate", "verify", "revoke", "approve", "permitted-records", "grants", "audit-events", "review-action", "review-queue"}
            access_patient_match = re.match(r"^/api/doctor-access/([^/]+)$", path)
            if access_patient_match and access_patient_match.group(1) not in reserved:
                patient_id = unquote(access_patient_match.group(1))
                owned = await db.execute(select(Patient.id).where(Patient.id == patient_id, Patient.owner_id == user_id))
                if owned.scalar_one_or_none() is None:
                    return JSONResponse(status_code=403, content={"success": False, "error": {"code": "PATIENT_ACCESS_DENIED", "message": "You do not have access to this patient's access grants."}})

            doctor_only = (
                path in {"/api/doctor-access/verify", "/api/doctor-access/approve", "/api/doctor-access/grants", "/api/doctor-access/audit-events", "/api/doctor-access/review-action"}
                or (path == "/api/doctor-access/review-queue" and request.method == "GET")
                or path.startswith("/api/doctor-access/review-queue/")
                or path.startswith("/api/doctor-access/permitted-records/")
            )
            if doctor_only:
                doctor_result = await db.execute(select(Doctor.id).where(Doctor.user_id == user_id, Doctor.is_active.is_(True)))
                doctor_id = doctor_result.scalar_one_or_none()
                if doctor_id is None:
                    return JSONResponse(status_code=403, content={"success": False, "error": {"code": "DOCTOR_ACCESS_REQUIRED", "message": "An active doctor account is required for this action."}})
                patient_path_match = re.match(r"^/api/doctor-access/(?:permitted-records|review-queue/summary)/([^/]+)$", path)
                if patient_path_match:
                    patient_id = unquote(patient_path_match.group(1))
                    grant = await db.execute(select(DoctorAccess.id).where(
                        DoctorAccess.patient_id == patient_id,
                        DoctorAccess.doctor_id == doctor_id,
                        DoctorAccess.status == "ACTIVE",
                        DoctorAccess.revoked_at.is_(None),
                        DoctorAccess.expires_at > datetime.now(timezone.utc),
                    ))
                    if grant.scalar_one_or_none() is None:
                        return JSONResponse(status_code=403, content={"success": False, "error": {"code": "DOCTOR_GRANT_REQUIRED", "message": "No active patient-approved access grant was found."}})
                item_match = re.match(r"^/api/doctor-access/review-queue/([^/]+)/resolve$", path)
                if item_match:
                    item_result = await db.execute(select(ReviewQueueItem.patient_id).where(ReviewQueueItem.id == unquote(item_match.group(1))))
                    patient_id = item_result.scalar_one_or_none()
                    if patient_id is not None:
                        grant = await db.execute(select(DoctorAccess.id).where(
                            DoctorAccess.patient_id == patient_id,
                            DoctorAccess.doctor_id == doctor_id,
                            DoctorAccess.status == "ACTIVE",
                            DoctorAccess.revoked_at.is_(None),
                            DoctorAccess.expires_at > datetime.now(timezone.utc),
                        ))
                        if grant.scalar_one_or_none() is None:
                            return JSONResponse(status_code=403, content={"success": False, "error": {"code": "DOCTOR_GRANT_REQUIRED", "message": "An active patient-approved access grant is required."}})
    except Exception:
        logger.exception("API ownership check failed")
        return JSONResponse(status_code=503, content={"success": False, "error": {"code": "OWNERSHIP_CHECK_FAILED", "message": "Patient access could not be verified."}})

    return await call_next(request)


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again.",
            },
        },
    )


# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api"

app.include_router(auth.router,           prefix=API_PREFIX)
app.include_router(patients.router,       prefix=API_PREFIX)
app.include_router(visits.router,         prefix=API_PREFIX)
app.include_router(documents.router,      prefix=API_PREFIX)
app.include_router(medications.router,    prefix=API_PREFIX)
app.include_router(labs.router,           prefix=API_PREFIX)
app.include_router(changes.router,        prefix=API_PREFIX)
app.include_router(decisions.router,      prefix=API_PREFIX)
app.include_router(decision_memory.router, prefix=API_PREFIX)
app.include_router(doctor_access.router,  prefix=API_PREFIX)
app.include_router(summary.router,        prefix=API_PREFIX)
app.include_router(companion.router,      prefix=API_PREFIX)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["system"])
async def health_check():
    return {
        "success": True,
        "data": {
            "status": "ok",
            "app": settings.app_name,
            "env": settings.app_env,
            "version": "1.0.0",
        },
        "message": "HealthContinuum AI backend is running",
    }


from fastapi.staticfiles import StaticFiles

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent  # .../maruthi/Health
MARUTHI_ROOT = FRONTEND_DIR.parent                             # .../maruthi
WORKSPACE_ROOT = MARUTHI_ROOT.parent                          # .../Downloads/maruthi
NO_CACHE_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}

# Mount patient app assets if present
if (FRONTEND_DIR / "assets").exists():
    app.mount("/patient/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="patient_assets")


@app.get("/assets/{file_path:path}", include_in_schema=False)
async def serve_root_assets(file_path: str):
    # Serve patient app assets only
    # Check patient assets
    patient_asset = FRONTEND_DIR / "assets" / file_path
    if patient_asset.exists():
        return FileResponse(patient_asset, headers=NO_CACHE_HEADERS)
    return JSONResponse(status_code=404, content={"message": "Asset not found"})



@app.get("/api/config", include_in_schema=False)
async def public_supabase_config():
    """Return only browser-safe Supabase settings; never expose a service-role key."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        return JSONResponse(
            status_code=503,
            content={"error": "Supabase public configuration is not set on this backend."},
            headers={"Cache-Control": "no-store"},
        )
    return JSONResponse(
        content={"supabaseUrl": settings.supabase_url, "supabaseAnonKey": settings.supabase_anon_key},
        headers={"Cache-Control": "no-store"},
    )


# ── Patient App Landing Page ───────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
@app.get("/portal", include_in_schema=False)
async def serve_patient_landing():
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path, media_type="text/html", headers=NO_CACHE_HEADERS)
    return JSONResponse(status_code=404, content={"message": "Patient app not found"})


# ── Patient App Routes ────────────────────────────────────────────────────────
@app.get("/patient", include_in_schema=False)
@app.get("/patient/{full_path:path}", include_in_schema=False)
async def serve_patient_app(full_path: str = ""):
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path, media_type="text/html", headers=NO_CACHE_HEADERS)
    return JSONResponse(status_code=404, content={"message": "Patient app not found"})


# ── Direct Patient App Static Assets ──────────────────────────────────────────
@app.get("/styles.css", include_in_schema=False)
async def serve_styles():
    return FileResponse(FRONTEND_DIR / "styles.css", media_type="text/css", headers=NO_CACHE_HEADERS)


@app.get("/app.js", include_in_schema=False)
async def serve_app_js():
    return FileResponse(FRONTEND_DIR / "app.js", media_type="application/javascript", headers=NO_CACHE_HEADERS)


@app.get("/api.js", include_in_schema=False)
async def serve_api_js():
    return FileResponse(FRONTEND_DIR / "api.js", media_type="application/javascript", headers=NO_CACHE_HEADERS)


