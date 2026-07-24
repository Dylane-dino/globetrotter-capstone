from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, destinations, itineraries, recommendations, users

app = FastAPI(
    title="GlobeTrotter Travel Assistant - Yaoundé Edition",
    description=(
        "Phase 1: Monolith. A single FastAPI service backed by flat JSON "
        "files, covering auth, destination search, personalized "
        "recommendations, and itinerary management for Yaoundé, Cameroon."
    ),
    version="0.2.0",
)

# Dev-friendly CORS: the Next.js frontend runs on a different port
# (localhost:3000) than the API (localhost:8000), and browsers block
# cross-origin requests by default without this. Tightened to explicit
# localhost origins for now; a real deployment should list only the actual
# frontend domain(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(destinations.router)
app.include_router(users.router)
app.include_router(itineraries.router)
app.include_router(recommendations.router)


@app.get("/", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "service": "globetrotter-yaounde",
        "phase": "1 - monolith",
    }
