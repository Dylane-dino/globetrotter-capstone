from fastapi import APIRouter, HTTPException, Query

from app import storage
from app.models import Destination

router = APIRouter(prefix="/destinations", tags=["destinations"])


@router.get("", response_model=list[Destination])
def search_destinations(
    q: str | None = Query(default=None, description="Free-text search on name/description"),
    category: str | None = Query(default=None, description="e.g. nature, culture, food"),
    tag: str | None = Query(default=None, description="Filter by a single tag"),
    max_cost_fcfa: int | None = Query(default=None, description="Filter by average cost ceiling"),
):
    results = storage.read_all("destinations")

    if q:
        q_lower = q.lower()
        results = [
            d for d in results
            if q_lower in d["name"].lower() or q_lower in d["description"].lower()
        ]
    if category:
        results = [d for d in results if d["category"].lower() == category.lower()]
    if tag:
        results = [d for d in results if tag.lower() in [t.lower() for t in d.get("tags", [])]]
    if max_cost_fcfa is not None:
        results = [d for d in results if d["avg_cost_fcfa"] <= max_cost_fcfa]

    return results


@router.get("/{destination_id}", response_model=Destination)
def get_destination(destination_id: str):
    destination = storage.find_by_id("destinations", destination_id)
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")
    return destination
