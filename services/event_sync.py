"""
services/event_sync.py — Live Event Ingestion Service for JustIn-Time

Pulls real-time upcoming events from external provider APIs, normalises them
into the JustIn-Time schema, and upserts into the local SQLite database.

Supported sources
-----------------
  ticketmaster  — Ticketmaster Discovery API v2 (free API key, generous rate limits)
  serpapi       — SerpApi "Google Events" endpoint (100 free searches/month)
  mock_feed     — Built-in realistic sample feed (zero config, great for demos)

Quick usage
-----------
  # Programmatic (from FastAPI routes or startup hook)
  from services.event_sync import EventSyncService
  svc = EventSyncService(source="ticketmaster", api_key="YOUR_KEY")
  result = await svc.run()          # async — non-blocking

  # CLI dry-run (no DB writes)
  python services/event_sync.py --source mock_feed --dry-run

  # CLI live ingest from Ticketmaster for Mumbai
  python services/event_sync.py --source ticketmaster --api-key TM_KEY --city Mumbai

Environment variables (alternative to passing api_key)
-------------------------------------------------------
  TICKETMASTER_API_KEY
  SERPAPI_API_KEY
"""

from __future__ import annotations

import os
import sys
import asyncio
import argparse
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import httpx

# Allow running directly (python services/event_sync.py)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.event import Event
from models.venue import Venue
from services.geo import haversine_km

logger = logging.getLogger("event_sync")
logging.basicConfig(level=logging.INFO, format="[EventSync] %(levelname)s %(message)s")

# IST timezone offset
IST = timezone(timedelta(hours=5, minutes=30))

# Category normalisation mapping
_CATEGORY_MAP: Dict[str, str] = {
    "music": "concert",    "concert": "concert",
    "rock": "concert",     "pop": "concert",
    "festival": "concert", "edm": "concert",
    "comedy": "comedy",    "standup": "comedy",   "stand-up": "comedy",
    "cricket": "sport",    "football": "sport",   "sports": "sport",
    "ipl": "sport",        "nba": "sport",        "tennis": "sport",
    "cinema": "movie",     "film": "movie",       "movie": "movie",
    "theatre": "theatre",  "play": "theatre",     "drama": "theatre",
    "opera": "theatre",
}

# Major Indian city geocentroids used for Ticketmaster radius search
CITY_COORDS: Dict[str, Dict[str, float]] = {
    "Mumbai":    {"lat": 19.0760, "lng": 72.8777},
    "Delhi":     {"lat": 28.6139, "lng": 77.2090},
    "Bangalore": {"lat": 12.9716, "lng": 77.5946},
    "Hyderabad": {"lat": 17.3850, "lng": 78.4867},
    "Chennai":   {"lat": 13.0827, "lng": 80.2707},
    "Kolkata":   {"lat": 22.5726, "lng": 88.3639},
    "Pune":      {"lat": 18.5204, "lng": 73.8567},
}

TICKETMASTER_BASE = "https://app.ticketmaster.com/discovery/v2"
SERPAPI_BASE = "https://serpapi.com/search"


def _normalize_category(raw: str) -> str:
    c = (raw or "").strip().lower()
    for key, mapped in _CATEGORY_MAP.items():
        if key in c:
            return mapped
    return "other"


def _resolve_or_create_venue(
    db,
    name: str,
    city: str,
    lat: float,
    lng: float,
    allows_outside_delivery: bool = False,
    allows_inseat_delivery: bool = False,
) -> Venue:
    """
    Geo-deduplication: reuse any existing venue in the same city within 300 m
    or with an identical name. Creates a new Venue row otherwise.
    """
    for v in db.query(Venue).filter(Venue.city.ilike(city)).all():
        if haversine_km(lat, lng, v.lat, v.lng) <= 0.3 or v.name.lower() == name.lower():
            return v

    venue = Venue(
        name=name,
        city=city,
        address=f"{name}, {city}",
        lat=lat,
        lng=lng,
        allows_outside_delivery=allows_outside_delivery,
        allows_inseat_delivery=allows_inseat_delivery,
    )
    db.add(venue)
    db.commit()
    db.refresh(venue)
    logger.info("Created new venue #%s: %s (%s)", venue.id, venue.name, venue.city)
    return venue


def _upsert_event(db, item: Dict[str, Any], dry_run: bool = False) -> Optional[Event]:
    """
    Idempotent event write. Matches on (name, venue_id, date) — safe to call
    repeatedly as the same live feed comes in.
    """
    category = _normalize_category(item.get("category", "other"))

    venue = _resolve_or_create_venue(
        db,
        name=item["venue_name"],
        city=item["city"],
        lat=item["lat"],
        lng=item["lng"],
        allows_outside_delivery=item.get("allows_outside_delivery", False),
        allows_inseat_delivery=item.get("allows_inseat_delivery", False),
    )

    existing = (
        db.query(Event)
        .filter(
            Event.name.ilike(item["name"]),
            Event.venue_id == venue.id,
            Event.date == item["date"],
        )
        .first()
    )
    if existing:
        logger.debug("Skip (already exists): %s on %s", item["name"], item["date"])
        return existing

    if dry_run:
        logger.info(
            "[DRY RUN] Would insert: %s (%s) @ %s on %s %s",
            item["name"], category, venue.name, item["date"], item["start_time"],
        )
        return None

    event = Event(
        name=item["name"],
        venue_id=venue.id,
        city=item["city"],
        date=item["date"],
        start_time=item["start_time"],
        end_time=item.get("end_time"),
        category=category,
        lat=item["lat"],
        lng=item["lng"],
        simulated_mins_until_show=item.get("mins_until_show", 180),
        total_seats=item.get("total_seats", 500),
        language=item.get("language", "English/Hindi"),
        organizer=item.get("organizer", "External Feed"),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    logger.info("Ingested event #%s: %s", event.id, event.name)
    return event


# ---------------------------------------------------------------------------
# Adapters
# ---------------------------------------------------------------------------

class _TicketmasterAdapter:
    """
    Fetches upcoming events from the Ticketmaster Discovery API v2.
    Free API key: https://developer.ticketmaster.com/
    Rate limit   : 5 req/sec, 5 000 req/day.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def fetch(
        self,
        cities: Optional[List[str]] = None,
        start_date_utc: Optional[str] = None,
        size: int = 20,
    ) -> List[Dict[str, Any]]:
        target_cities = cities or list(CITY_COORDS.keys())
        start_dt = start_date_utc or datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        results: List[Dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            for city in target_cities:
                coords = CITY_COORDS.get(city)
                if not coords:
                    logger.warning("No coords for city: %s — skipping", city)
                    continue
                try:
                    resp = await client.get(
                        f"{TICKETMASTER_BASE}/events.json",
                        params={
                            "apikey": self.api_key,
                            "latlong": f"{coords['lat']},{coords['lng']}",
                            "radius": "30",
                            "unit": "km",
                            "startDateTime": start_dt,
                            "size": min(size, 200),
                            "sort": "date,asc",
                            "countryCode": "IN",
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    events_raw = data.get("_embedded", {}).get("events", [])
                    logger.info("Ticketmaster: %d events found for %s", len(events_raw), city)
                    for ev in events_raw:
                        normalised = self._normalise(ev, city, coords)
                        if normalised:
                            results.append(normalised)
                except httpx.HTTPStatusError as exc:
                    logger.error(
                        "Ticketmaster HTTP %s for city %s: %s",
                        exc.response.status_code, city, exc.response.text[:200],
                    )
                except Exception as exc:
                    logger.error("Ticketmaster error for city %s: %s", city, exc)

        return results

    def _normalise(self, ev: Dict, city: str, fallback_coords: Dict[str, float]) -> Optional[Dict[str, Any]]:
        try:
            name = ev.get("name", "Unknown Event")
            dates = ev.get("dates", {})
            start = dates.get("start", {})
            date_str = start.get("localDate")
            time_str = start.get("localTime", "19:00")[:5]
            if not date_str:
                return None

            classifications = ev.get("classifications", [{}])
            segment = classifications[0].get("segment", {}).get("name", "other")
            genre = classifications[0].get("genre", {}).get("name", "other")
            raw_cat = genre if genre.lower() not in ("undefined", "other") else segment

            venues_embedded = ev.get("_embedded", {}).get("venues", [{}])
            v = venues_embedded[0] if venues_embedded else {}
            venue_name = v.get("name", f"Venue in {city}")
            loc = v.get("location", {})
            lat = float(loc.get("latitude", fallback_coords["lat"]))
            lng = float(loc.get("longitude", fallback_coords["lng"]))
            promoter = ev.get("promoter", {}).get("name", "BookMyShow / Ticketmaster")

            return {
                "name": name,
                "venue_name": venue_name,
                "city": city,
                "lat": lat,
                "lng": lng,
                "date": date_str,
                "start_time": time_str,
                "end_time": None,
                "category": raw_cat,
                "mins_until_show": 180,
                "allows_outside_delivery": False,
                "allows_inseat_delivery": False,
                "total_seats": 500,
                "organizer": promoter,
                "source": "ticketmaster",
            }
        except Exception as exc:
            logger.debug("Ticketmaster normalise error for %s: %s", ev.get("name"), exc)
            return None


class _SerpApiAdapter:
    """
    Fetches upcoming events from SerpApi's Google Events results.
    Free tier: 100 searches/month — https://serpapi.com/
    Note: lat/lng approximated to city centroid (no geocoding needed for demo).
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def fetch(
        self,
        cities: Optional[List[str]] = None,
        query_suffix: str = "upcoming events concerts",
    ) -> List[Dict[str, Any]]:
        target_cities = cities or list(CITY_COORDS.keys())
        results: List[Dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            for city in target_cities:
                try:
                    resp = await client.get(
                        SERPAPI_BASE,
                        params={
                            "engine": "google_events",
                            "q": f"{city} {query_suffix}",
                            "api_key": self.api_key,
                            "hl": "en",
                            "gl": "in",
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    raw_events = data.get("events_results", [])
                    logger.info("SerpApi: %d events for %s", len(raw_events), city)
                    coords = CITY_COORDS.get(city, {"lat": 19.0760, "lng": 72.8777})
                    for ev in raw_events:
                        normalised = self._normalise(ev, city, coords)
                        if normalised:
                            results.append(normalised)
                except httpx.HTTPStatusError as exc:
                    logger.error(
                        "SerpApi HTTP %s for %s: %s",
                        exc.response.status_code, city, exc.response.text[:200],
                    )
                except Exception as exc:
                    logger.error("SerpApi error for %s: %s", city, exc)

        return results

    def _normalise(self, ev: Dict, city: str, coords: Dict[str, float]) -> Optional[Dict[str, Any]]:
        try:
            name = ev.get("title", "Unknown Event")
            date_info = ev.get("date", {})
            start_date_raw = date_info.get("start_date", "")
            when_raw = date_info.get("when", "")
            date_str, time_str = self._parse_serpapi_date(start_date_raw or when_raw)
            if not date_str:
                return None
            venue_info = ev.get("venue", {})
            address_list = ev.get("address", [])
            venue_name = venue_info.get("name") or (address_list[0] if address_list else city)
            raw_cat = ev.get("type", "other")
            return {
                "name": name,
                "venue_name": venue_name or f"Venue in {city}",
                "city": city,
                "lat": coords["lat"],
                "lng": coords["lng"],
                "date": date_str,
                "start_time": time_str,
                "end_time": None,
                "category": raw_cat,
                "mins_until_show": 180,
                "allows_outside_delivery": False,
                "allows_inseat_delivery": False,
                "total_seats": 500,
                "organizer": "Google Events / SerpApi",
                "source": "serpapi",
            }
        except Exception as exc:
            logger.debug("SerpApi normalise error: %s", exc)
            return None

    @staticmethod
    def _parse_serpapi_date(raw: str):
        """Parse SerpApi date strings to (YYYY-MM-DD, HH:MM)."""
        if not raw:
            return None, "19:00"
        try:
            from dateutil import parser as dp
            dt = dp.parse(raw, fuzzy=True)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M") if dt.hour else "19:00"
        except Exception:
            return None, "19:00"


class _MockFeedAdapter:
    """
    Built-in realistic sample feed — no API key required.
    Generates events with dates relative to now() so they always stay in the future.
    """

    async def fetch(self, **_kwargs) -> List[Dict[str, Any]]:
        now = datetime.now(tz=IST)

        def future(days: int) -> str:
            return (now + timedelta(days=days)).strftime("%Y-%m-%d")

        return [
            {
                "name": "Dua Lipa: Radical Optimism Tour",
                "venue_name": "MMRDA Grounds, BKC",
                "city": "Mumbai",
                "lat": 19.0600, "lng": 72.8656,
                "date": future(17), "start_time": "19:30", "end_time": "22:30",
                "category": "concert", "mins_until_show": 180,
                "allows_outside_delivery": False, "allows_inseat_delivery": False,
                "total_seats": 30000, "organizer": "Live Nation & BookMyShow",
            },
            {
                "name": "Comic Con India 2026: Live Stage",
                "venue_name": "KTPO Trade Centre, Whitefield",
                "city": "Bangalore",
                "lat": 12.9808, "lng": 77.7292,
                "date": future(22), "start_time": "18:00", "end_time": "22:00",
                "category": "festival", "mins_until_show": 240,
                "allows_outside_delivery": True, "allows_inseat_delivery": True,
                "total_seats": 8000, "organizer": "Comic Con India",
            },
            {
                "name": "Diljit Dosanjh: Dil-Luminati Arena",
                "venue_name": "Jawaharlal Nehru Stadium",
                "city": "Delhi",
                "lat": 28.5828, "lng": 77.2344,
                "date": future(30), "start_time": "19:30", "end_time": "23:00",
                "category": "concert", "mins_until_show": 180,
                "allows_outside_delivery": False, "allows_inseat_delivery": False,
                "total_seats": 75000, "organizer": "Saregama Live",
            },
            {
                "name": "Anubhav Singh Bassi: Naya Show",
                "venue_name": "Shilpakala Vedika",
                "city": "Hyderabad",
                "lat": 17.4475, "lng": 78.3762,
                "date": future(35), "start_time": "20:30", "end_time": "22:00",
                "category": "comedy", "mins_until_show": 180,
                "allows_outside_delivery": True, "allows_inseat_delivery": False,
                "total_seats": 5000, "organizer": "Bassi Productions",
            },
            {
                "name": "IPL Playoff: MI vs CSK",
                "venue_name": "Wankhede Stadium",
                "city": "Mumbai",
                "lat": 18.9388, "lng": 72.8259,
                "date": future(10), "start_time": "19:30", "end_time": "23:00",
                "category": "cricket", "mins_until_show": 150,
                "allows_outside_delivery": False, "allows_inseat_delivery": True,
                "total_seats": 33000, "organizer": "BCCI / IPL",
            },
            {
                "name": "Zakir Khan: Haq Se Single Tour",
                "venue_name": "Chowdiah Memorial Hall",
                "city": "Bangalore",
                "lat": 13.0098, "lng": 77.5653,
                "date": future(14), "start_time": "19:00", "end_time": "21:00",
                "category": "comedy", "mins_until_show": 120,
                "allows_outside_delivery": True, "allows_inseat_delivery": False,
                "total_seats": 1200, "organizer": "OML Entertainment",
            },
            {
                "name": "A.R. Rahman: Infinite Love World Tour",
                "venue_name": "Jawaharlal Nehru Indoor Stadium",
                "city": "Chennai",
                "lat": 13.0827, "lng": 80.2797,
                "date": future(25), "start_time": "18:30", "end_time": "22:00",
                "category": "concert", "mins_until_show": 210,
                "allows_outside_delivery": False, "allows_inseat_delivery": False,
                "total_seats": 15000, "organizer": "BookMyShow Live",
            },
            {
                "name": "Bengaluru International Film Festival",
                "venue_name": "PVR Orion Mall",
                "city": "Bangalore",
                "lat": 12.9716, "lng": 77.5710,
                "date": future(7), "start_time": "10:00", "end_time": "22:00",
                "category": "movie", "mins_until_show": 60,
                "allows_outside_delivery": False, "allows_inseat_delivery": False,
                "total_seats": 400, "organizer": "BIFFES",
            },
        ]


# ---------------------------------------------------------------------------
# Main service class
# ---------------------------------------------------------------------------

class EventSyncService:
    """
    Orchestrates live event ingestion from a configured source.

    Usage
    -----
    svc = EventSyncService(source="ticketmaster", api_key=os.getenv("TICKETMASTER_API_KEY"))
    result = await svc.run()

    svc = EventSyncService(source="serpapi", api_key=os.getenv("SERPAPI_API_KEY"))

    # Demo / CI — no API key needed
    svc = EventSyncService(source="mock_feed")
    """

    def __init__(
        self,
        source: str = "mock_feed",
        api_key: Optional[str] = None,
        cities: Optional[List[str]] = None,
        dry_run: bool = False,
    ):
        self.source = source
        self.api_key = api_key
        self.cities = cities
        self.dry_run = dry_run

    async def run(self) -> Dict[str, Any]:
        """
        Fetch events from the configured source and upsert into the database.
        Returns a summary dict safe to return directly as a JSON API response.
        """
        started_at = datetime.now(tz=IST).isoformat()
        items: List[Dict[str, Any]] = []

        if self.source == "ticketmaster":
            if not self.api_key:
                raise ValueError(
                    "Ticketmaster requires an API key. "
                    "Set TICKETMASTER_API_KEY env var or pass api_key=."
                )
            items = await _TicketmasterAdapter(self.api_key).fetch(cities=self.cities)

        elif self.source == "serpapi":
            if not self.api_key:
                raise ValueError(
                    "SerpApi requires an API key. "
                    "Set SERPAPI_API_KEY env var or pass api_key=."
                )
            items = await _SerpApiAdapter(self.api_key).fetch(cities=self.cities)

        elif self.source == "mock_feed":
            items = await _MockFeedAdapter().fetch()

        else:
            raise ValueError(
                f"Unknown source: {self.source!r}. Choose: ticketmaster | serpapi | mock_feed"
            )

        db = SessionLocal()
        ingested, skipped, errors = [], [], []
        try:
            for item in items:
                try:
                    ev = _upsert_event(db, item, dry_run=self.dry_run)
                    if ev and not self.dry_run:
                        ingested.append({
                            "id": ev.id,
                            "name": ev.name,
                            "city": ev.city,
                            "date": ev.date,
                            "category": ev.category,
                            "source": item.get("source", self.source),
                        })
                    else:
                        skipped.append(item["name"])
                except Exception as exc:
                    logger.error("Upsert failed for %s: %s", item.get("name"), exc)
                    errors.append({"name": item.get("name"), "error": str(exc)})
        finally:
            db.close()

        completed_at = datetime.now(tz=IST).isoformat()
        return {
            "status": "dry_run" if self.dry_run else "success",
            "source": self.source,
            "started_at": started_at,
            "completed_at": completed_at,
            "fetched_count": len(items),
            "ingested_count": len(ingested),
            "skipped_count": len(skipped),
            "error_count": len(errors),
            "ingested": ingested,
            "skipped": skipped,
            "errors": errors,
        }


# ---------------------------------------------------------------------------
# APScheduler background job (optional)
# ---------------------------------------------------------------------------

_scheduler = None


def start_background_sync(
    source: str = "mock_feed",
    api_key: Optional[str] = None,
    interval_minutes: int = 30,
):
    """
    Start a background APScheduler job that periodically syncs events.
    Call this once from the FastAPI lifespan startup hook.

    Requires: pip install apscheduler
    """
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
    except ImportError:
        logger.warning(
            "apscheduler not installed — background sync disabled. "
            "Run: pip install apscheduler"
        )
        return None

    global _scheduler
    if _scheduler and _scheduler.running:
        logger.info("Scheduler already running — skipping re-init.")
        return _scheduler

    async def _sync_job():
        logger.info("Scheduled sync triggered (source=%s)", source)
        svc = EventSyncService(source=source, api_key=api_key)
        result = await svc.run()
        logger.info(
            "Scheduled sync done: %d ingested, %d skipped, %d errors",
            result["ingested_count"], result["skipped_count"], result["error_count"],
        )

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _sync_job,
        "interval",
        minutes=interval_minutes,
        next_run_time=datetime.now(),
        id="event_sync_job",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(
        "Background event sync started — interval: %d min, source: %s",
        interval_minutes, source,
    )
    return _scheduler


def stop_background_sync():
    """Gracefully stop the scheduler (call from FastAPI shutdown hook)."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Background event sync stopped.")


# ---------------------------------------------------------------------------
# CLI entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="JustIn-Time Live Event Sync",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # No API key needed — uses built-in realistic mock feed
  python services/event_sync.py --source mock_feed

  # Preview what would be inserted (no DB writes)
  python services/event_sync.py --source mock_feed --dry-run

  # Ticketmaster live data for Mumbai + Delhi
  python services/event_sync.py --source ticketmaster \\
      --api-key YOUR_TM_KEY --cities Mumbai Delhi

  # SerpApi (Google Events) — all major Indian cities
  python services/event_sync.py --source serpapi --api-key YOUR_SERPAPI_KEY
        """,
    )
    parser.add_argument(
        "--source", default="mock_feed",
        choices=["ticketmaster", "serpapi", "mock_feed"],
        help="Data source to pull from (default: mock_feed)",
    )
    parser.add_argument("--api-key", default=None, help="API key for the chosen source")
    parser.add_argument(
        "--cities", nargs="+", default=None,
        help="City names to query. E.g. --cities Mumbai Delhi Bangalore",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be ingested without writing to the database",
    )
    args = parser.parse_args()

    api_key = args.api_key
    if not api_key:
        if args.source == "ticketmaster":
            api_key = os.getenv("TICKETMASTER_API_KEY")
        elif args.source == "serpapi":
            api_key = os.getenv("SERPAPI_API_KEY")

    svc = EventSyncService(
        source=args.source,
        api_key=api_key,
        cities=args.cities,
        dry_run=args.dry_run,
    )
    result = asyncio.run(svc.run())

    print("\n=== Event Sync Result ===")
    print(f"  Source         : {result['source']}")
    print(f"  Status         : {result['status']}")
    print(f"  Fetched        : {result['fetched_count']}")
    print(f"  Ingested (new) : {result['ingested_count']}")
    print(f"  Skipped (dup)  : {result['skipped_count']}")
    print(f"  Errors         : {result['error_count']}")
    if result["ingested"]:
        print("\n  Newly added events:")
        for ev in result["ingested"]:
            print(f"    #{ev['id']:>3} | {ev['date']} | {ev['category']:8} | {ev['name']} ({ev['city']})")
    if result["errors"]:
        print("\n  Errors:")
        for err in result["errors"]:
            print(f"    x {err['name']}: {err['error']}")
    print()
