"""Verify Supabase Auth access tokens using the Auth user endpoint.

Do not decode or trust client-supplied JWT claims locally. The Supabase Auth
service validates the bearer token and returns the canonical user identity.
"""
from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException, Request, status

from app.core.config import get_settings

settings = get_settings()


def bearer_token(request: Request) -> str | None:
    value = request.headers.get("Authorization", "")
    scheme, _, token = value.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


async def verify_supabase_access_token(token: str) -> dict[str, Any]:
    """Return the verified Supabase user or raise an auth/configuration error."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SUPABASE_AUTH_NOT_CONFIGURED",
                "message": "Supabase Auth is not configured on the API server.",
            },
        )

    url = settings.supabase_url.rstrip("/") + "/auth/v1/user"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(8.0)) as client:
            response = await client.get(
                url,
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Authorization": f"Bearer {token}",
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SUPABASE_AUTH_UNAVAILABLE",
                "message": "Could not verify the Supabase session.",
            },
        ) from exc

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_SESSION", "message": "Sign in again to continue."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "INVALID_AUTH_RESPONSE", "message": "Supabase returned an invalid response."},
        ) from exc

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_SESSION", "message": "Sign in again to continue."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
