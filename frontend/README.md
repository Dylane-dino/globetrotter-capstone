# GlobeTrotter Travel Assistant — Frontend

A Next.js (App Router, TypeScript, Tailwind CSS) web app for the Phase 1
monolith backend — login/signup, a Pinterest-style interest picker during
onboarding, personalized recommendations, destination search, and itinerary
planning/sharing.

## Running it locally

The backend must be running first (see `../backend/README.md`).

```bash
npm install
cp .env.local.example .env.local   # then edit if your API runs elsewhere
npm run dev
```

Open `http://localhost:3000`.

### Google Maps configuration

Copy `.env.local.example` to `.env.local` and set
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to a Google Cloud browser key. Enable
**Maps JavaScript API** and **Directions API**, enable billing, and restrict
the key to your frontend HTTP referrers. Restart the dev server after editing
this file. The Gemini API key is backend-only: set `GEMINI_API_KEY` in the
root `.env`, never in this frontend file.

## Design decisions

**Branding.** The logo (`public/logo.png`, and a cropped icon-only mark at
`src/app/icon.png` used as the favicon) is the project's real designed
logo, with its background keyed out for transparency so it drops cleanly
onto both light surfaces (navbar) and photo backgrounds (auth pages, with
a subtle drop-shadow applied via the `onPhoto` prop on `<Logo />`).

**Auth pages.** Login and signup (step 1) use a full-bleed photo with a
frosted glass card floating on top - the same treatment on both pages for
consistency. The onboarding interest grid (signup step 2) intentionally
switches to a clean, non-photographic background instead: with 7 tiles
each showing their own photo, adding a third busy photo behind them would
hurt legibility rather than help it.

One deliberate omission: the earlier design's "Forgot password?" and
"Sign in with Google" affordances aren't backed by real functionality yet
(no password-reset flow, no OAuth integration). "Forgot password?" is kept
as a honest placeholder - clicking it shows an inline note rather than
silently failing or pretending to work. The Google button was left out
entirely rather than shipped as a non-functional decoration.

**Visual identity.** Rather than a generic travel-app look, the palette and
type are grounded in Yaoundé itself: a deep forest-canopy green, a warm
laterite (red-earth) accent, and marigold gold, paired with Fraunces
(display), Inter (body), and Space Mono (labels/eyebrows).

**Cross-platform via responsive web, not native apps.** One Next.js
codebase adapts to phone, tablet, and desktop through responsive layout,
rather than maintaining separate iOS/Android codebases — the right tradeoff
for this project's scope.

**Auth-gated browsing, public sharing.** Destination browsing, search, and
"My Trips" require being logged in. An individual itinerary page
(`/itineraries/[id]`) is intentionally viewable by anyone with the link,
without an account — matching the "share itineraries with friends and
family" business requirement. Only the owner sees edit/delete/share
controls there.

**Onboarding maps directly to the recommendation engine.** The 7 interest
tiles in `src/lib/interests.ts` each map to real tags used in the backend's
`destinations.json` — so picking "Museums & Culture" and "Restaurants &
Food" during signup immediately affects what `/recommendations` returns on
first login. No separate "category" concept needed on the backend.

## Project structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # fonts, global providers
│   │   ├── globals.css             # design tokens, stamp motif
│   │   ├── page.tsx                # login (route: /)
│   │   ├── signup/page.tsx         # 2-step signup: basics -> interests
│   │   ├── home/page.tsx           # recommendations + search/browse
│   │   ├── destinations/[id]/page.tsx
│   │   └── itineraries/
│   │       ├── page.tsx            # "My Trips" list
│   │       └── [id]/page.tsx       # itinerary detail (public + owner controls)
│   ├── components/                 # Navbar, DestinationCard, modals, form fields...
│   ├── context/AuthContext.tsx     # session state + persistence
│   └── lib/
│       ├── api.ts                  # typed client for every backend endpoint
│       ├── interests.ts            # onboarding categories -> tags mapping
│       └── types.ts                # mirrors backend Pydantic models
└── public/images/                  # the 15 Yaoundé destination photos
```

## A note on package versions

Dependencies are pinned to specific versions rather than "latest", and were
checked against `npm audit` at time of writing (0 known vulnerabilities).
Notably this uses Next.js 15.5.21 with React 18.3 (Next 15 supports React
18.2+, so there was no need to also adopt React 19). A couple of Next's own
*nested* dependencies (`sharp`, `postcss`) needed a version override to
clear their advisories - see the `overrides` field in `package.json`.

## Known limitations (fair to flag for Phase 1)

- No frontend unit/component tests (e.g. Jest + React Testing Library) yet.
  CI does run `next lint` and a full production build (which includes
  TypeScript type-checking) on every push, and the backend has a real
  pytest suite - but there's no automated coverage of frontend component
  behavior itself. A real headless-browser click-through wasn't possible
  in the environment this was built in either; it's worth doing a manual
  pass through signup → login → recommendations → add-to-itinerary → share
  before treating this as fully verified.
- Session tokens live in `localStorage`, which is fine for a course project
  but not ideal against XSS in a production app (an httpOnly cookie would
  be the harder-to-implement, more secure choice).
- No image upload/management yet - photos are static files shipped with
  the frontend, matching Phase 1's "flat files instead of a database"
  philosophy.
