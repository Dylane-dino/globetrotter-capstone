from fastapi import APIRouter, HTTPException

from app import storage
from app.models import RecommendationRequest

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

# Rough cost bands used to translate a user's budget_level into an FCFA ceiling.
# These are intentionally simple - real budget modelling can come later.
BUDGET_CEILINGS = {
    "low": 2000,
    "medium": 6000,
    "high": 999999,
}

# Categories that are practical/utility entries rather than leisure
# destinations. They stay searchable via /destinations, but we don't want
# them showing up as a "recommended" travel experience.
EXCLUDED_FROM_RECOMMENDATIONS = {"hospital"}


def score_destination(destination: dict, preferred_tags: set[str], budget_level: str | None) -> float:
    """
    Very simple, explainable scoring function for Phase 1:
      - +2 points per matching tag
      - + destination's own rating (0-5)
      - -3 point penalty if it clearly exceeds the user's budget band
    This is a stand-in for a real recommendation model, which we can
    revisit once we have actual user behaviour data to learn from.
    """
    score = 0.0
    dest_tags = set(t.lower() for t in destination.get("tags", []))
    score += 2 * len(preferred_tags & dest_tags)
    score += destination.get("rating", 0)

    if budget_level:
        ceiling = BUDGET_CEILINGS.get(budget_level.lower())
        if ceiling is not None and destination.get("avg_cost_fcfa", 0) > ceiling:
            score -= 3

    return score


@router.post("")
def get_recommendations(payload: RecommendationRequest):
    preferred_tags = set(t.lower() for t in payload.preferred_tags)
    budget_level = payload.budget_level

    if payload.user_id:
        user = storage.find_by_id("users", payload.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        preferred_tags |= set(t.lower() for t in user.get("preferred_tags", []))
        budget_level = budget_level or user.get("budget_level")

    destinations = [
        d for d in storage.read_all("destinations")
        if d["category"].lower() not in EXCLUDED_FROM_RECOMMENDATIONS
    ]
    scored = [
        {**d, "score": score_destination(d, preferred_tags, budget_level)}
        for d in destinations
    ]
    scored.sort(key=lambda d: d["score"], reverse=True)

    return scored[: payload.limit]
