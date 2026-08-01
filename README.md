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

## API keys: maps and AI

Two keys are needed for the optional live integrations. The Gemini key stays
on the backend; never expose it in a `NEXT_PUBLIC_*` variable.

1. Copy `.env.example` to `.env` in the project root and set
   `GEMINI_API_KEY=...`. Create this key in Google AI Studio. FastAPI reads
   it when it starts.
2. Copy `frontend/.env.local.example` to `frontend/.env.local` and set
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...`. Create a Google Cloud browser key,
   enable **Maps JavaScript API** and **Directions API**, enable billing,
   and restrict it to your HTTP referrers (for example
   `http://localhost:3000/*` during development).
3. Restart `uvicorn` and `npm run dev` after changing keys.

With Docker, put both variables in the root `.env` and run
`docker compose up --build`. The Maps key is embedded during the frontend
build, so rebuilding is required after changing it.

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
database, no token revocation, a single deploy unit instead of independent
services. Each of these gaps is the specific thing the next phase exists to
address — see each folder's own README for the reasoning behind these
choices.

## Running with Docker

Two containers - `backend` (FastAPI) and `frontend` (Next.js) - orchestrated
by `docker-compose.yml` at the repo root.

```bash
cp .env.example .env        # optional but recommended - sets a real JWT secret
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000` (docs at `/docs`)
- `docker compose down` to stop; add `-v` to also remove the healthcheck
  state (there's no separate data volume to worry about - see below).

**Data persistence.** The backend container bind-mounts `./backend/data`
from your machine, so any accounts/itineraries created while it's running
are written straight to those same JSON files on your host - they survive
`docker compose down` and rebuilds, exactly like running the backend
without Docker at all.

**The JWT secret.** Falls back to a dev default if you skip the `.env`
step above. Fine for trying things out locally; set a real one (via `.env`)
for anything you'd share beyond your own machine.

**Rebuilding after code changes.** `docker compose up --build` picks up
backend changes immediately (just rebuilds that layer). Frontend changes
need a rebuild too, since `next build` runs once at image-build time, not
on every container start - there's no live-reload in this Docker setup
(that's a `npm run dev` thing, intentionally not what these containers do).

## Continuous Integration

Both a GitHub Actions workflow and a Jenkins pipeline are included, running
the same checks: backend tests, frontend dependency audit, lint, and a
production build. Neither has a deploy stage yet — that's intentionally
deferred to Phase 3, once there's an actual container image and hosting
target to ship to.

**GitHub Actions** (`.github/workflows/ci.yml`) runs automatically on every
push/PR to `main` or `develop` once this repo is pushed to GitHub — nothing
to configure. Check the **Actions** tab on GitHub to see runs.

**Jenkins** (`Jenkinsfile` at the repo root) requires a Jenkins server with
Docker available (each stage runs in an official `python`/`node` image, so
the Jenkins host itself doesn't need Python or Node.js pre-installed - just
Docker). To use it:
1. In Jenkins: **New Item → Pipeline** (or **Multibranch Pipeline** if you
   want a build per branch/PR automatically).
2. Under **Pipeline**, choose **Pipeline script from SCM**, point it at
   this repo, and set the script path to `Jenkinsfile`.
3. Run it. Backend test results show up in the build's **Test Result**
   page (via JUnit XML); the frontend's `.next` build output is archived
   as a build artifact.

Both pipelines check:
- Backend: `pytest` (30 tests — auth, ownership checks, destinations,
  recommendations, itineraries) against an isolated temp copy of the data
  files, so CI runs never touch the real seed data.
- Frontend: `npm audit` (fails on high/critical), `next lint`, `next build`
  (which also runs the TypeScript type checker).

## Next: Phase 2 (Microservices)

Split the backend into independent services (Users/Auth, Destinations,
Itineraries, Recommendations), each with its own database, talking over
REST/gRPC behind an API gateway. The frontend's `lib/api.ts` is already
written against clean REST boundaries, so it shouldn't need major changes
— just pointed at different service URLs (or a gateway) once Phase 2 lands.
Phase 3 (Cloud Deployment) is also when the CI pipelines above grow a real
deploy stage.
