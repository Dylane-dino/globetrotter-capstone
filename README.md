# GlobeTrotter Travel Assistant — Yaoundé Edition

**Phase 1: Monolith** (target: end of Class 3)

A travel recommendation assistant scoped to Yaoundé, Cameroon — search
destinations, get personalized recommendations based on your interests,
and plan/share itineraries. This phase pairs a FastAPI monolith with a
Next.js web frontend.

```
globetrotter-yaounde-project/
├── backend/     FastAPI + JSON file storage (see backend/README.md)
└── frontend/    Next.js + TypeScript + Tailwind (see frontend/README.md)
```

## Running the whole thing

You need both halves running at once, in two terminals.

**Terminal 1 — backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the
interactive API explorer.

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Runs at `http://localhost:3000` — open this in your browser.

## Trying it out

1. Go to `http://localhost:3000` and click **Create an account**.
2. Fill in name/email/password, continue, then pick at least 2 interests
   from the grid (Museums, Restaurants, Sport & Outdoors, etc.).
3. You'll land on the Home dashboard with recommendations already tailored
   to what you picked.
4. Open any destination, click **Add to itinerary**, create a new trip.
5. Go to **My Trips** to see it, rename it, remove stops, or **Share** it
   by email — try opening the itinerary's direct link in a private/
   incognito window to see the public "shared trip" view.

## What's real vs. simplified in Phase 1

**Real:** password hashing (bcrypt), signed JWT sessions, ownership checks
on itinerary edits, a working rule-based recommendation engine, full
search/filter, responsive design across phone/tablet/desktop.

**Simplified (intentionally, for Phase 1):** JSON files instead of a
database, no token revocation, no automated test suite, a single deploy
unit instead of independent services. Each of these gaps is the specific
thing the next phase exists to address — see each folder's own README for
the reasoning behind these choices.

## Next: Phase 2 (Microservices)

Split the backend into independent services (Users/Auth, Destinations,
Itineraries, Recommendations), each with its own database, talking over
REST/gRPC behind an API gateway. The frontend's `lib/api.ts` is already
written against clean REST boundaries, so it shouldn't need major changes
— just pointed at different service URLs (or a gateway) once Phase 2 lands.
