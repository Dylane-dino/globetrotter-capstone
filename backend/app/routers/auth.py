import uuid

from fastapi import APIRouter, Depends, HTTPException

from app import auth, storage
from app.models import LoginRequest, TokenResponse, User, UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(payload: UserCreate):
    existing = [u for u in storage.read_all("users") if u["email"].lower() == payload.email.lower()]
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_record = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "email": payload.email,
        "preferred_tags": payload.preferred_tags,
        "budget_level": payload.budget_level,
        "password_hash": auth.hash_password(payload.password),
    }
    storage.append("users", user_record)

    token = auth.create_access_token(user_record["id"])
    return TokenResponse(access_token=token, user=User(**user_record))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    users = storage.read_all("users")
    user_record = next((u for u in users if u["email"].lower() == payload.email.lower()), None)

    # Deliberately identical error for "no such user" and "wrong password" -
    # confirming which one is true would let an attacker enumerate emails.
    invalid_credentials = HTTPException(status_code=401, detail="Incorrect email or password")

    if not user_record:
        raise invalid_credentials
    if not auth.verify_password(payload.password, user_record["password_hash"]):
        raise invalid_credentials

    token = auth.create_access_token(user_record["id"])
    return TokenResponse(access_token=token, user=User(**user_record))


@router.get("/me", response_model=User)
def get_me(current_user: dict = Depends(auth.get_current_user)):
    return current_user
