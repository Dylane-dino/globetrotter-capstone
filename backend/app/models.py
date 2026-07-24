from pydantic import BaseModel, Field


class Destination(BaseModel):
    id: str
    name: str
    category: str
    tags: list[str] = []
    description: str
    neighborhood: str
    rating: float
    avg_cost_fcfa: int
    lat: float
    lng: float
    images: list[str] = []


class UserCreate(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=6, description="Plain password - hashed before storage, never stored as-is")
    preferred_tags: list[str] = Field(
        default=[], description="e.g. ['nature', 'food', 'history']"
    )
    budget_level: str = Field(
        default="medium", description="'low', 'medium', or 'high'"
    )


class User(BaseModel):
    """
    Public-facing user representation. Deliberately excludes password_hash -
    FastAPI/Pydantic strip any extra fields on the stored record that aren't
    declared here, so it's safe to return this even from a dict that still
    has password_hash in it.
    """
    id: str
    name: str
    email: str
    preferred_tags: list[str] = []
    budget_level: str = "medium"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class ItineraryItem(BaseModel):
    destination_id: str
    day: int = Field(ge=1, description="Day number within the trip, starting at 1")
    note: str | None = None


class ItineraryCreate(BaseModel):
    user_id: str
    title: str
    items: list[ItineraryItem] = []


class ItineraryUpdate(BaseModel):
    title: str | None = None
    items: list[ItineraryItem] | None = None


class Itinerary(BaseModel):
    id: str
    user_id: str
    title: str
    items: list[ItineraryItem] = []
    shared_with: list[str] = []


class ShareRequest(BaseModel):
    email: str


class RecommendationRequest(BaseModel):
    user_id: str | None = None
    preferred_tags: list[str] = []
    budget_level: str | None = None
    limit: int = 5
