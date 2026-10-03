# Campusly Backend

A Flask + SQLite API for the Campusly frontend. It covers the pieces the
static site currently fakes with `localStorage`: accounts, bookmarks,
posted opportunities, and a dashboard — while keeping the same data shape
the frontend already uses, so wiring them together is mostly swapping
`localStorage` calls for `fetch()` calls.

## Project structure

```text
campusly-backend/
├── app.py              # application factory + entry point
├── config.py           # settings (reads from environment variables)
├── database.py         # shared SQLAlchemy instance
├── models.py           # User, Opportunity, Bookmark, ViewedOpportunity
├── seed_data.py         # the same 30 demo opportunities as js/data.js
├── requirements.txt
└── routes/
    ├── auth.py          # signup, login, profile, interests
    ├── opportunities.py # list/search/filter/sort, detail, post
    ├── bookmarks.py     # save/unsave, list saved
    └── dashboard.py     # saved + deadlines + recommendations + streak
```

## Run it locally

```bash
cd campusly-backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API starts at `http://127.0.0.1:5000`. A `campusly.db` SQLite file is
created automatically and pre-filled with the 30 demo opportunities on
first run — nothing else to set up.

## Authentication

Sign up or log in to get a JWT, then send it as
`Authorization: Bearer <token>` on any endpoint marked "auth required".

```bash
curl -X POST http://127.0.0.1:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Aisha","email":"aisha@example.com","password":"secret123"}'
```

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Create an account, returns a token |
| POST | `/api/auth/login` | – | Returns a token |
| GET | `/api/auth/me` | required | Current user |
| PUT | `/api/auth/interests` | required | Update interest tags |
| GET | `/api/categories` | – | Category names + open counts |
| GET | `/api/opportunities` | – | List, with query params below |
| GET | `/api/opportunities/<id>` | optional | Detail; logs a view if signed in |
| POST | `/api/opportunities` | optional | Create one (the "Post Opportunity" form) |
| GET | `/api/bookmarks` | required | List saved opportunities |
| POST | `/api/bookmarks/<id>` | required | Save |
| DELETE | `/api/bookmarks/<id>` | required | Unsave |
| GET | `/api/dashboard` | required | Saved, deadlines, recommended, streak, profile % |

### `GET /api/opportunities` query params

`category`, `location`, `type` (Online/In-person/Hybrid), `tag`,
`q` (free-text search), `deadline_within` (days), `sort`
(`r` recommended, `n` newest, `d` deadline soon, `a` recently added).

Example: `/api/opportunities?category=Internship&tag=AI&sort=d`

## Connecting the existing frontend

The frontend currently keeps everything in `localStorage` inside
`js/script.js` (the `store` helper and functions like `all()`, `saved()`,
`postForm()`, `signIn()`). To connect this backend:

1. Set `CORS_ORIGINS` (in `config.py` or an environment variable) to your
   frontend's URL, e.g. your GitHub Pages address.
2. Replace `all()` with a `fetch('/api/opportunities')` call, and merge in
   local demo data only if you want an offline fallback.
3. Replace the bookmark toggle in `store.set("cs_saved", ...)` with
   `POST`/`DELETE` calls to `/api/bookmarks/<id>`, guarded by whether a
   token exists.
4. Replace `signIn()`'s local-only form with calls to `/api/auth/login`
   and `/api/auth/signup`, storing the returned token (in memory or
   `localStorage`, since a token isn't sensitive user data the same way a
   password is).
5. Point the dashboard's four grids at `/api/dashboard` instead of the
   local `dash()` calculations.

This is a natural next step, not required for the hackathon demo — the
static frontend works fine on its own with `localStorage`.

## Notes for judges / production

- SQLite is used for zero-setup local development. Set `DATABASE_URL` to a
  Postgres URL to swap it for something durable.
- All demo opportunities are seeded with `is_demo: true`, matching the
  frontend's "Demo Opportunity" labels — nothing here is a real listing.
- Passwords are hashed with Werkzeug's `generate_password_hash`; never
  logged or returned in any response.
- `SECRET_KEY` and `JWT_SECRET_KEY` default to placeholder values for local
  dev — set real ones via environment variables before deploying anywhere
  public.
