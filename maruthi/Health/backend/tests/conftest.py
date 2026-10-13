"""
Shared Pytest Configuration and Fixtures for HealthContinuum AI
"""
from __future__ import annotations

import os
os.environ.setdefault("APP_ENV", "test")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database.connection import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    """Create all tables once for the test session and seed test doctor."""
    async with test_engine.begin() as conn:
        from app.models import (  # noqa: F401
            audit_log,
            change_event,
            clinical_decision,
            conversation,
            decision_memory,
            doctor,
            doctor_access,
            document,
            evidence,
            lab_result,
            medication,
            patient,
            visit,
        )
        await conn.run_sync(Base.metadata.create_all)

    # Seed test doctor
    async with TestSessionLocal() as session:
        from app.core.security import hash_password
        from app.models.doctor import Doctor
        test_doc = Doctor(
            id="doc-001",
            email="ananya.sharma@continuumhealth.in",
            password_hash=hash_password("demo1234"),
            full_name="Dr. Ananya Sharma",
            credentials="MD, DM (Cardiology)",
            registration_number="KMC-20145-NN",
            specialty="Cardiology",
            facility_name="Continuum Health Centre, Bengaluru",
            facility_id="fac-001",
            avatar_initials="AS",
            verified=True,
            role="doctor",
            is_active=True,
        )
        session.add(test_doc)
        await session.commit()

    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def doctor_token(client) -> str:
    """Helper fixture providing an authenticated doctor JWT."""
    res = await client.post("/api/auth/doctor/login", json={
        "email": "ananya.sharma@continuumhealth.in",
        "password": "demo1234",
    })
    return res.json()["data"]["access_token"]

