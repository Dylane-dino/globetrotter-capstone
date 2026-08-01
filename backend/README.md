# GlobeTrotter Travel Assistant — Yaoundé Edition

**Phase 1: Monolith** (target: end of Class 3)

A single FastAPI service, backed by flat JSON files instead of a database,
covering auth, destination search, personalized recommendations, and
itinerary management — scoped to Yaoundé, Cameroon.

> This is the backend half of the project. For running the frontend
> alongside it, see the top-level `README.md` one directory up.

## Why a monolith, and why JSON files?

This phase exists to give us a working baseline and to *feel* the limits
that later phases solve:

- **One codebase, one deploy** — simple to reason about, but every feature
  change touches the same app, and a bug anywhere can take everything down.
- **JSON files instead of a database** — no query language, no indexing,
  no safe concurrent writes across processes. Good enough for a handful of
  users; clearly not "millions of users globally." That gap is the whole
  point — Phase 2 gives each service its own real, independently scalable
  database.

## Project structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app + router wiring + CORS
│   ├── auth.py              # password hashing + JWT session tokens
│   ├── storage.py           # JSON file read/write layer (stand-in for a DB)
│   ├── models.py            # Pydantic schemas
│   └── routers/
│       ├── auth.py          # signup / login / me
│       ├── destinations.py  # search & lookup
│       ├── users.py         # public profile reads
│       ├── itineraries.py   # CRUD + sharing (ownership-checked writes)
│       └── recommendations.py # rule-based scoring engine
├── data/
│   ├── destinations.json    # seeded with 15 Yaoundé POIs
│   ├── users.json           # starts empty
│   ├── itineraries.json     # starts empty
│   └── images/               # one photo per destination, used by the frontend
├── requirements.txt
└── README.md
```

## Running it locally

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then open `http://127.0.0.1:8000/docs` for the interactive Swagger UI
(FastAPI generates this automatically — use it to try every endpoint
without writing a client).

### Gemini configuration

Set `GEMINI_API_KEY` in the root `.env` file (or in the backend process
environment) before starting FastAPI. The `/chat` endpoint uses
`gemini-2.5-flash`, retrieves from the local destination catalogue, and
filters output against that catalogue before returning it. Never put this
key in a frontend or `NEXT_PUBLIC_*` variable.

## Testing

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

30 tests covering auth (signup/login/tokens), destination search, the
recommendation engine, and itinerary CRUD + ownership enforcement. Tests
never touch the real `data/*.json` files — `tests/conftest.py` points the
app at an isolated temp copy (via the `GLOBETROTTER_DATA_DIR` env var,
see `app/storage.py`) before the app is even imported, so running the
suite is always safe to do against your real seed data.

This is also what both CI pipelines (`.github/workflows/ci.yml` and the
root `Jenkinsfile`) run on every push.

## Endpoints

| Method | Path                              | Auth required?            | Purpose                                   |
|--------|------------------------------------|----------------------------|--------------------------------------------|
| POST   | `/auth/signup`                     | No                          | Create an account (hashes password, returns a session token) |
| POST   | `/auth/login`                      | No                          | Log in (returns a session token)          |
| GET    | `/auth/me`                         | Yes                         | Get the currently logged-in user           |
| GET    | `/destinations`                    | No                          | Search/filter destinations (`q`, `category`, `tag`, `max_cost_fcfa`) |
| GET    | `/destinations/{id}`               | No                          | Get one destination                        |
| GET    | `/users/{id}`                      | No                          | Get a user's public profile                |
| GET    | `/users/{id}/itineraries`          | No                          | List a user's itineraries (public, for sharing) |
| POST   | `/itineraries`                     | Yes (must be own account)   | Create an itinerary                        |
| GET    | `/itineraries/{id}`                | No                          | Get an itinerary (public, for sharing)     |
| PUT    | `/itineraries/{id}`                | Yes (must be owner)         | Update an itinerary                        |
| DELETE | `/itineraries/{id}`                | Yes (must be owner)         | Delete an itinerary                        |
| POST   | `/itineraries/{id}/share`          | Yes (must be owner)         | Share an itinerary by email                |
| POST   | `/recommendations`                 | No                          | Get scored destination recommendations     |
| GET    | `/community/posts`                 | No                          | List community posts                       |
| POST   | `/community/posts`                 | Yes                         | Publish a community post                   |
| POST   | `/community/posts/{id}/comments`   | Yes                         | Comment on a post                          |
| POST   | `/chat`                            | No                          | Gemini RAG answer with FCFA estimates      |

## Authentication

Phase 1 uses real password hashing (bcrypt) and signed JWT session tokens
(7-day expiry), but keeps things simple in ways that are fine for a course
project and worth revisiting for a real deployment:

- `JWT_SECRET_KEY` falls back to a dev default if not set as an environment
  variable. Set a real one via `export JWT_SECRET_KEY=...` before deploying
  anywhere public.
- No token revocation - "logging out" just means the frontend discards the
  token. Fine for now; a denylist or short-lived + refresh tokens would be
  the Phase 4 (resilience) upgrade.
- Reads (destinations, itinerary-by-id, a user's itinerary list) are public
  on purpose, since the business requirement is that itineraries can be
  shared with people who don't have an account. Writes (create/update/
  delete/share an itinerary) require a valid token AND that the token's
  user matches the itinerary's owner.

## How this maps to the business/technical requirements

- ✅ Users can create an account and log in (signup/login with hashed
  passwords and real sessions)
- ✅ Search destinations + get personalized recommendations
- ✅ Create/view/manage itineraries
- ✅ Share itineraries (basic — stores an email list per itinerary)
- ⚠️ "Handle millions of users globally" — explicitly **not** solved yet;
  that's the reason Phases 2–4 exist
- ⚠️ "No single point of failure" — the opposite is true right now, by
  design, so the contrast with later phases is obvious
- ✅ Observable in a minimal sense (FastAPI's built-in `/docs`); real
  logging/metrics/tracing arrives in Phase 4

## A design note on categories

The dataset includes a hospital (Hôpital Général de Yaoundé) alongside
leisure destinations, since it's useful information for travelers to have
on hand. It's fully searchable via `/destinations`, but it's deliberately
excluded from `/recommendations` — a hospital isn't something we want to
suggest as a "top pick" alongside a lake or a museum. See
`EXCLUDED_FROM_RECOMMENDATIONS` in `app/routers/recommendations.py` if this
list needs to grow later.

## Next: Phase 2 (Microservices)

We'll split this into independent services (Users, Destinations,
Itineraries, Recommendations), each with its own database, talking over
REST/gRPC behind an API gateway.
