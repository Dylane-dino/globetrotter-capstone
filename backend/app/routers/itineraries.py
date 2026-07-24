import uuid

from fastapi import APIRouter, Depends, HTTPException

from app import auth, storage
from app.models import Itinerary, ItineraryCreate, ItineraryUpdate, ShareRequest, User

router = APIRouter(prefix="/itineraries", tags=["itineraries"])


def _require_ownership(itinerary: dict, current_user: dict) -> None:
    if itinerary["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this itinerary")


@router.post("", response_model=Itinerary, status_code=201)
def create_itinerary(payload: ItineraryCreate, current_user: dict = Depends(auth.get_current_user)):
    if payload.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only create itineraries for your own account")

    for item in payload.items:
        if not storage.find_by_id("destinations", item.destination_id):
            raise HTTPException(
                status_code=404,
                detail=f"Destination '{item.destination_id}' not found",
            )

    itinerary = Itinerary(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        title=payload.title,
        items=payload.items,
        shared_with=[],
    )
    storage.append("itineraries", itinerary.model_dump())
    return itinerary


@router.get("/{itinerary_id}", response_model=Itinerary)
def get_itinerary(itinerary_id: str):
    # Public read - lets a shared link work for someone without an account.
    itinerary = storage.find_by_id("itineraries", itinerary_id)
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return itinerary


@router.put("/{itinerary_id}", response_model=Itinerary)
def update_itinerary(
    itinerary_id: str,
    payload: ItineraryUpdate,
    current_user: dict = Depends(auth.get_current_user),
):
    itinerary = storage.find_by_id("itineraries", itinerary_id)
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    _require_ownership(itinerary, current_user)

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    updated = storage.update_by_id("itineraries", itinerary_id, updates)
    return updated


@router.delete("/{itinerary_id}", status_code=204)
def delete_itinerary(itinerary_id: str, current_user: dict = Depends(auth.get_current_user)):
    itinerary = storage.find_by_id("itineraries", itinerary_id)
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    _require_ownership(itinerary, current_user)

    storage.delete_by_id("itineraries", itinerary_id)


@router.post("/{itinerary_id}/share", response_model=Itinerary)
def share_itinerary(
    itinerary_id: str,
    payload: ShareRequest,
    current_user: dict = Depends(auth.get_current_user),
):
    itinerary = storage.find_by_id("itineraries", itinerary_id)
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    _require_ownership(itinerary, current_user)

    shared_with = set(itinerary.get("shared_with", []))
    shared_with.add(payload.email)
    updated = storage.update_by_id(
        "itineraries", itinerary_id, {"shared_with": list(shared_with)}
    )
    return updated
