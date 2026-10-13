"""
HealthContinuum AI — Companion Chat and Conversation Persistence Routes
POST /api/patients/{patient_id}/companion/chat
POST /api/patients/{patient_id}/companion/ask (legacy compatible)
GET  /api/patients/{patient_id}/conversations
GET  /api/patients/{patient_id}/conversations/{conversation_id}/messages
"""
from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models.conversation import Conversation, Message
from app.schemas.schemas import (
    APIResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    CitationSource,
    ConversationOut,
    MessageOut,
)
from app.services import companion_service, patient_service

router = APIRouter(prefix="/patients", tags=["companion"])


# ── Legacy Models (for backward compatibility) ────────────────────────────────
class CompanionAskRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)


class CompanionSource(BaseModel):
    title: str
    date: str
    type: str
    doc_id: str | None = None


class CompanionAskData(BaseModel):
    answer: str
    source: CompanionSource | None = None
    provider: str
    provider_note: str | None = None
    documented_facts: list[str] = []


# ── Comprehensive Chat Endpoint ───────────────────────────────────────────────
@router.post(
    "/{patient_id}/companion/chat",
    response_model=APIResponse[ChatMessageResponse],
)
async def chat_companion(
    patient_id: str,
    payload: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Production AI Companion Endpoint:
    - 16-Intent routing
    - Deterministic Emergency Interception
    - Unreadable Prescription Safety Policy
    - RAG retrieval strictly isolated to patient_id
    - Full English and Telugu (తెలుగు) support
    - Persistent Conversation Memory
    - Validated Citation Sources
    """
    patient = await patient_service.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            404,
            detail={"code": "PATIENT_NOT_FOUND", "message": "Patient not found"},
        )

    result = await companion_service.generate_companion_chat(
        db=db,
        patient_id=patient_id,
        query=payload.query,
        conversation_id=payload.conversation_id,
        requested_language=payload.language,
    )

    # Format citations as CitationSource
    raw_cits = result.get("citations", [])
    formatted_cits = [CitationSource(**c) if isinstance(c, dict) else c for c in raw_cits]

    response_data = ChatMessageResponse(
        conversation_id=result.get("conversation_id", ""),
        message_id=result.get("message_id", ""),
        answer=result.get("answer", ""),
        language=result.get("language", "en"),
        intent=result.get("intent", "GENERAL_HEALTH_EDUCATION"),
        citations=formatted_cits,
        safety_status=result.get("safety_status", "SAFE"),
        uncertainty_notes=result.get("uncertainty_notes"),
        suggested_next_actions=result.get("suggested_next_actions", []),
        provider=result.get("provider", "grounded_records_engine"),
        provider_note=result.get("provider_note"),
        documented_facts=result.get("documented_facts", []),
    )

    return APIResponse(
        success=True,
        data=response_data,
        message="AI companion response generated",
    )


# ── Legacy Ask Endpoint (preserved for backward compatibility) ─────────────────
@router.post(
    "/{patient_id}/companion/ask",
    response_model=APIResponse[CompanionAskData],
)
async def ask_companion(
    patient_id: str,
    payload: CompanionAskRequest,
    db: AsyncSession = Depends(get_db),
):
    patient = await patient_service.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            404,
            detail={"code": "PATIENT_NOT_FOUND", "message": "Patient not found"},
        )

    result = await companion_service.generate_companion_response(
        db, patient_id, payload.query
    )

    return APIResponse(
        success=True,
        data=CompanionAskData(**result),
        message="Companion response generated successfully",
    )


# ── List Conversations ────────────────────────────────────────────────────────
@router.get(
    "/{patient_id}/conversations",
    response_model=APIResponse[list[ConversationOut]],
)
async def list_conversations(
    patient_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve saved conversations for patient."""
    patient = await patient_service.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            404,
            detail={"code": "PATIENT_NOT_FOUND", "message": "Patient not found"},
        )

    stmt = (
        select(Conversation)
        .where(Conversation.patient_id == patient_id)
        .order_by(desc(Conversation.updated_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    convs = list(result.scalars().all())

    # Map to schema
    output = []
    for c in convs:
        output.append(
            ConversationOut(
                id=c.id,
                patient_id=c.patient_id,
                title=c.title,
                language=c.language,
                created_at=c.created_at,
                updated_at=c.updated_at,
                messages=[],
            )
        )

    return APIResponse(success=True, data=output)


# ── Get Conversation Messages ─────────────────────────────────────────────────
@router.get(
    "/{patient_id}/conversations/{conversation_id}/messages",
    response_model=APIResponse[list[MessageOut]],
)
async def get_conversation_messages(
    patient_id: str,
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve messages for a specific conversation with patient authorization isolation."""
    # Ensure conversation belongs to patient
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.patient_id == patient_id,
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            404,
            detail={"code": "CONVERSATION_NOT_FOUND", "message": "Conversation not found or access denied"},
        )

    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id, Message.patient_id == patient_id)
        .order_by(Message.created_at)
    )
    msg_res = await db.execute(msg_stmt)
    messages = list(msg_res.scalars().all())

    output = [
        MessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            patient_id=m.patient_id,
            role=m.role,
            content=m.content,
            intent=m.intent,
            language=m.language,
            citations=(json.loads(m.citations_json) if m.citations_json else []),
            safety_status=m.safety_status,
            uncertainty_notes=m.uncertainty_notes,
            created_at=m.created_at,
        )
        for m in messages
    ]

    return APIResponse(success=True, data=output)
