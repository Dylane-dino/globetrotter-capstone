from fastapi import APIRouter, HTTPException

from app import storage
from app.models import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=User)
def get_user(user_id: str):
    user = storage.find_by_id("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/itineraries")
def get_user_itineraries(user_id: str):
    # Left public deliberately - itinerary sharing (a business requirement)
    # means a friend without an account should still be able to view a
    # user's shared trip. Write actions on itineraries ARE protected - see
    # routers/itineraries.py.
    itineraries = storage.read_all("itineraries")
    return [i for i in itineraries if i["user_id"] == user_id]
