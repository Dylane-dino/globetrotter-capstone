"""
Phase 1 authentication.

Deliberately simple, but not fake: passwords are hashed with bcrypt (never
stored in plain text), and sessions are real signed JWTs. What's simplified
for course-project scope:

- SECRET_KEY falls back to a dev default if not set via environment
  variable. In any real deployment this MUST come from an environment
  variable / secrets manager instead.
- Tokens are long-lived (7 days) for convenience during development and
  grading demos, rather than using short-lived access + refresh token pairs.
- No token revocation/blacklist - logging out is a client-side action
  (discarding the token), not a server-side one. Fine for Phase 1; Phase 4
  (resilience/observability) is a more natural place to revisit this if
  needed.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Header, HTTPException
from passlib.context import CryptContext

from app import storage

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-only-secret-change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    """Returns the user_id encoded in the token, or raises HTTPException."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return user_id


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """
    FastAPI dependency. Expects an "Authorization: Bearer <token>" header.
    Returns the full stored user record (including password_hash - callers
    that return this to the client MUST use response_model=User to strip it).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.removeprefix("Bearer ").strip()
    user_id = decode_access_token(token)

    user = storage.find_by_id("users", user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user
