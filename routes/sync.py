"""
routes/sync.py — Event Sync API endpoints for JustIn-Time

Exposes manual and status endpoints for the live event ingestion service.

POST /sync/run          — Trigger an immediate event sync (async)
GET  /sync/status       — Return last sync result (cached in-memory)
"""

import os
from fastapi import APIRouter, Query, HTTPException
from services.event_sync import EventSyncService

router = APIRouter(prefix="/sync", tags=["Event Sync"])

# In-memory cache of the last sync result (reset on server restart)
_last_result: dict | None = None


@router.post("/run", summary="Trigger a live event sync")
async def run_sync(
    source: str = Query(
        default="mock_feed",
        description="Data source: mock_feed | ticketmaster | serpapi",
        enum=["mock_feed", "ticketmaster", "serpapi"],
    ),
    dry_run: bool = Query(
        default=False,
        description="If true, previews what would be ingested without writing to DB",
    ),
    cities: str = Query(
        default=None,
        description="Comma-separated city names to query. E.g. Mumbai,Delhi,Bangalore",
    ),
):
    """
    Trigger an immediate event sync from the chosen data source.

    - **mock_feed** — No API key needed. Ingests 8 realistic built-in events with
      future-relative dates. Safe to run repeatedly (idempotent).
    - **ticketmaster** — Requires `TICKETMASTER_API_KEY` env var. Fetches real
      upcoming events across Indian cities from Ticketmaster Discovery API v2.
    - **serpapi** — Requires `SERPAPI_API_KEY` env var. Fetches Google Events
      results via SerpApi.

    Returns a full summary including newly ingested event IDs.
    """
    global _last_result

    api_key = None
    if source == "ticketmaster":
        api_key = os.getenv("TICKETMASTER_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=422,
                detail=(
                    "TICKETMASTER_API_KEY environment variable is not set. "
                    "Get a free key at https://developer.ticketmaster.com/"
                ),
            )
    elif source == "serpapi":
        api_key = os.getenv("SERPAPI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=422,
                detail=(
                    "SERPAPI_API_KEY environment variable is not set. "
                    "Get a free key at https://serpapi.com/"
                ),
            )

    city_list = [c.strip() for c in cities.split(",")] if cities else None

    svc = EventSyncService(
        source=source,
        api_key=api_key,
        cities=city_list,
        dry_run=dry_run,
    )

    result = await svc.run()
    _last_result = result
    return result


@router.get("/status", summary="Return the last sync result")
def sync_status():
    """
    Returns the cached result from the most recent sync run.
    Returns 404 if no sync has been triggered yet in this server session.
    """
    if _last_result is None:
        raise HTTPException(
            status_code=404,
            detail="No sync has been run in this server session. Call POST /sync/run first.",
        )
    return _last_result
