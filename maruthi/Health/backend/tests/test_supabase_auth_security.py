"""Security regression tests for Supabase-authenticated patient API access."""
from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app import main as main_module
from app.main import app
from app.models.patient import Patient
from tests.conftest import TestSessionLocal


@pytest.fixture
def production_auth(monkeypatch):
    """Exercise production middleware with a deterministic verified Supabase identity."""
    async def verify(_token: str):
        return {"id": "test-user-security-1", "email": "patient@synthetic.example"}

    monkeypatch.setattr(main_module.settings, "app_env", "production")
    monkeypatch.setattr(main_module, "AsyncSessionLocal", TestSessionLocal)
    monkeypatch.setattr(main_module, "verify_supabase_access_token", verify)


@pytest.mark.asyncio
async def test_patient_api_rejects_missing_bearer_token(production_auth):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/patients/security-private-patient")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


@pytest.mark.asyncio
async def test_patient_api_denies_another_users_patient(production_auth):
    async with TestSessionLocal() as db:
        db.add(Patient(
            id="security-private-patient",
            owner_id="some-other-user",
            name="Synthetic Private Patient",
            email="private@synthetic.example",
        ))
        await db.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/patients/security-private-patient",
            headers={"Authorization": "Bearer valid-test-token"},
        )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PATIENT_ACCESS_DENIED"


@pytest.mark.asyncio
async def test_patient_api_allows_its_verified_owner(production_auth):
    async with TestSessionLocal() as db:
        db.add(Patient(
            id="security-owned-patient",
            owner_id="test-user-security-1",
            name="Synthetic Owner Patient",
            email="owner@synthetic.example",
        ))
        await db.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/patients/security-owned-patient",
            headers={"Authorization": "Bearer valid-test-token"},
        )

    assert response.status_code == 200
    assert response.json()["data"]["id"] == "security-owned-patient"
