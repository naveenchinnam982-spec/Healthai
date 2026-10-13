"""
HealthContinuum AI — FastAPI Application Entry Point
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from pathlib import Path

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
from app.database.connection import create_all_tables

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthcontinuum")

settings = get_settings()


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables. Shutdown: clean up."""
    logger.info("Starting HealthContinuum AI backend...")
    await create_all_tables()
    logger.info("Database tables verified.")
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
    allow_origins=settings.cors_origins + ["*"],   # "*" for local file:// dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


