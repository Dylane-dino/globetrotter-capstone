import json
import logging
import os

from fastapi import APIRouter, Depends, HTTPException

from app import storage
from app.auth import get_current_user
from app.models import ChatRequest, ChatResponse, DestinationHighlight

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)


def _destination_context() -> str:
    return json.dumps([
        {"id": d["id"], "name": d["name"], "category": d["category"], "description": d["description"], "neighborhood": d["neighborhood"], "latitude": d["lat"], "longitude": d["lng"]}
        for d in storage.read_all("destinations")
    ], ensure_ascii=False)


def _offline_response(message: str) -> ChatResponse:
    """Return a useful answer while the external AI provider is unavailable."""
    destinations = storage.read_all("destinations")
    query = message.casefold()
    matches = [
        destination for destination in destinations
        if destination["name"].casefold() in query
        or any(word in query for word in destination["name"].casefold().split() if len(word) > 3)
    ]
    if matches:
        place = matches[0]
        return ChatResponse(message=(
            "I’m temporarily using GlobeTrotter’s local travel guide while the live AI reconnects. "
            f"{place['name']} is in {place['neighborhood']}: {place['description']}"
        ))
    return ChatResponse(message=(
        "I’m temporarily using GlobeTrotter’s local travel guide while the live AI reconnects. "
        "You can still ask about a destination listed in the app, transport in Yaoundé, "
        "or browse Destinations while the connection is restored."
    ))


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, _current_user: dict = Depends(get_current_user)):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("Trip AI is not configured; using the local travel guide")
        return _offline_response(payload.message)
    try:
        from google import genai
    except ImportError:
        logger.warning("Gemini SDK is not installed; using the local travel guide")
        return _offline_response(payload.message)

    origin = f"The user location is approximately {payload.latitude}, {payload.longitude}." if payload.latitude is not None and payload.longitude is not None else "Use central Yaoundé as the starting point for estimates."
    history = "\n".join(f"{item.role}: {item.message}" for item in payload.history) or "No previous messages."
    instruction = f"""You are GlobeTrotter AI, also called Trip AI: a friendly, expert, conversational Yaoundé travel assistant embedded in the GlobeTrotter app.
Your three roles are: (1) create step-by-step visit plans with what to do, best time to visit, and approximate stay duration, (2) calculate local transport and FCFA/XAF logistics, and (3) explain app features such as destination maps, Community Hub, My Trips, and turn-by-turn navigation.

Only recommend places in the official destination catalogue below. Do not invent a place, id, or coordinates. If a requested place is absent, explain politely that it is not yet listed in the app and use an empty suggested_destinations array. General and app-support questions should also use an empty array.
For every place recommended or planned, provide special_highlight, best_time_to_visit, estimated_stay_duration, and exactly four transport options: Shared Taxi / Bus, Private Taxi, Motorbike, Train / Transit. Include duration_minutes, estimated_cost_fcfa, and notes for each option. For intra-city rail, use 0 duration and cost with a clear "Not applicable within urban Yaoundé" note. {origin}

Return ONLY valid JSON in this exact shape: {{"message":"natural answer; include step-by-step trip plan here when requested","suggested_destinations":[{{"id":"dest-001","name":"...","latitude":0,"longitude":0,"special_highlight":"...","best_time_to_visit":"...","estimated_stay_duration":"...","transport":[{{"mode":"Shared Taxi / Bus","duration_minutes":0,"estimated_cost_fcfa":0,"notes":"..."}},{{"mode":"Private Taxi","duration_minutes":0,"estimated_cost_fcfa":0,"notes":"..."}},{{"mode":"Motorbike","duration_minutes":0,"estimated_cost_fcfa":0,"notes":"..."}},{{"mode":"Train / Transit","duration_minutes":0,"estimated_cost_fcfa":0,"notes":"..."}}]}}]}}.

Official destinations: {_destination_context()}
Conversation so far: {history}
"""
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model="gemini-2.5-flash", contents=payload.message, config={"system_instruction": instruction, "response_mime_type": "application/json"})
        result = ChatResponse.model_validate_json(response.text)
    except Exception:
        # Keep the diagnostic in the server logs without exposing provider or
        # credential details to a traveller, and still give them a response.
        logger.exception("Trip AI provider request failed")
        return _offline_response(payload.message)

    valid = {item["id"]: item for item in storage.read_all("destinations")}
    grounded: list[DestinationHighlight] = []
    for item in result.suggested_destinations:
        destination = valid.get(item.id)
        if destination:
            grounded.append(item.model_copy(update={"name": destination["name"], "latitude": destination["lat"], "longitude": destination["lng"]}))
    return result.model_copy(update={"suggested_destinations": grounded})
