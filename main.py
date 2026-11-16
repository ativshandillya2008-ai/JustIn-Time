"""
main.py — JustIn-Time Backend Entrypoint

FastAPI application with all routes mounted.
Run with: uvicorn main:app --reload

API docs available at: http://localhost:8000/docs
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from database import engine, Base
import models  # Register all ORM models before table creation

from routes import events, venues, listings, bookings, pilot, seed as seed_router, chat as chat_router
from routes import sync as sync_router, agent as agent_router
from services.event_sync import start_background_sync, stop_background_sync
from services.agentic_scout import start_agentic_background_worker, stop_agentic_background_worker

# ── Create all tables on startup ──────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Lifespan: start/stop background event sync & agentic worker ───────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: kick off periodic sync (mock_feed by default; swap source
    # for ticketmaster/serpapi and set the matching env var in production)
    import os
    source = os.getenv("EVENT_SYNC_SOURCE", "mock_feed")
    api_key = os.getenv("TICKETMASTER_API_KEY") or os.getenv("SERPAPI_API_KEY")
    interval = int(os.getenv("EVENT_SYNC_INTERVAL_MINS", "30"))
    start_background_sync(source=source, api_key=api_key, interval_minutes=interval)

    # Start the autonomous Agentic AI scout daemon for BookMyShow & Swiggy
    start_agentic_background_worker(interval_seconds=300)
    yield
    # On shutdown: stop workers cleanly
    stop_background_sync()
    stop_agentic_background_worker()

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="JustIn-Time API",
    description=(
        "Live intelligent orchestration engine that bridges entertainment discovery & ticketing "
        "(BookMyShow) with instant food fulfillment and dining (Swiggy: Dineout, Scenes, Bolt) "
        "tailored to venue food policies, real-time showtimes, and proximity.\n\n"
        "**Core endpoint**: `GET /bookings/{id}/orchestration` — the rules engine.\n\n"
        "Start with `POST /seed` to populate baseline data, then explore bookings and live catalog.\n\n"
        "**Live event sync**: `POST /sync/run` — pull real-time events into the database."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Frontend Path Configuration ────────────────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

# ── SPA Browser Routing Middleware ──────────────────────────────────────────
# When a visitor opens or refreshes http://localhost:8000/, /events, /auth, etc. in a browser,
# serve the compiled React SPA index.html so the website is displayed directly.
@app.middleware("http")
async def spa_fallback_middleware(request: Request, call_next):
    accept = request.headers.get("accept", "")
    path = request.url.path

    # Check if this is a browser navigation request for HTML (not an API call or docs)
    api_prefixes = (
        "/api", "/docs", "/redoc", "/openapi.json",
        "/health", "/seed", "/sync", "/chat", "/agent", "/venues",
        "/listings", "/bookings", "/pilot-metrics", "/assets",
    )
    if (
        request.method == "GET"
        and "text/html" in accept
        and not path.startswith(api_prefixes)
    ):
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)

    return await call_next(request)

# ── Mount Frontend Assets ────────────────────────────────────────────────────
if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="frontend-assets")

# ── Mount routers ─────────────────────────────────────────────────────────────
app.include_router(seed_router.router)
app.include_router(venues.router)
app.include_router(events.router)
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(pilot.router)
app.include_router(chat_router.router)
app.include_router(sync_router.router)
app.include_router(agent_router.router)


@app.get("/health", tags=["Health"])
def health_check():
    """Diagnostic health check verifying DB connectivity and live inventory counts."""
    import time
    from database import SessionLocal
    from models.event import Event
    from models.venue import Venue

    start = time.time()
    db = SessionLocal()
    try:
        event_count = db.query(Event).count()
        venue_count = db.query(Venue).count()
        latency_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "healthy",
            "database": "connected",
            "latency_ms": latency_ms,
            "counts": {
                "events": event_count,
                "venues": venue_count,
            },
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database_error": str(e),
        }
    finally:
        db.close()


@app.get("/", include_in_schema=False)
def root():
    """Serves the working web application at root."""
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "service": "JustIn-Time Orchestration Engine",
        "status": "running",
        "version": "1.0.0",
        "notice": "Frontend build not found. Run 'npm run build' inside frontend/.",
        "docs": "/docs",
    }


@app.get("/vite.svg", include_in_schema=False)
def vite_svg():
    svg_path = os.path.join(FRONTEND_DIST, "vite.svg")
    if os.path.exists(svg_path):
        return FileResponse(svg_path)
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.get("/api", tags=["Health"])
def api_info():
    """API quick start guide and endpoint index."""
    return {
        "service": "JustIn-Time Orchestration Engine",
        "status": "running",
        "version": "1.0.0",
        "quick_start": [
            "1. POST /seed  — Reset & populate baseline catalog (events, venues, dining options)",
            "2. GET  /bookings/1/orchestration  — Scenario A: Coldplay (2 of 3 lanes)",
            "3. GET  /bookings/2/orchestration  — Scenario B: KBC Live (all 3 lanes)",
            "4. GET  /bookings/3/orchestration  — Scenario C: Comedy 45min (only Bolt)",
            "5. POST /bookings/{id}/lane-selection  — Record user lane choice",
            "6. GET  /pilot-metrics  — View aggregated pilot dashboard stats",
            "7. POST /chat  — AI Concierge chatbot grounded in live database",
            "8. POST /sync/run  — Pull live real-time events into the database",
            "9. GET  /sync/status  — Check the result of the last sync run",
        ],
        "docs": "/docs",
    }

