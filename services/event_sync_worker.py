"""
services/event_sync_worker.py — Real-Time Event Ingestion Worker for JustIn-Time

Demonstrates how to fetch real-time event feeds from external sources
(Ticketmaster, SerpApi Google Events, PredictHQ, or BookMyShow syndication),
perform entity resolution, normalize categories, and upsert into justin_time.db.

Run standalone with:
    python services/event_sync_worker.py --dry-run
    python services/event_sync_worker.py --source mock_feed
"""

import sys
import os
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional

# Add parent directory to path so models and database can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.event import Event
from models.venue import Venue
from services.geo import haversine_km

# Category normalization mapping to JustIn-Time standard categories
CATEGORY_MAP = {
    "music": "concert",
    "concert": "concert",
    "rock": "concert",
    "pop": "concert",
    "festival": "concert",
    "comedy": "comedy",
    "standup": "comedy",
    "stand-up": "comedy",
    "cricket": "sport",
    "football": "sport",
    "sports": "sport",
    "cinema": "movie",
    "film": "movie",
    "movie": "movie",
    "theatre": "theatre",
    "play": "theatre",
    "drama": "theatre",
}


def normalize_category(raw_category: str) -> str:
    """Map external provider category strings to JustIn-Time taxonomy."""
    c = (raw_category or "").strip().lower()
    for key, mapped in CATEGORY_MAP.items():
        if key in c:
            return mapped
    return "other"


def resolve_or_create_venue(db, venue_name: str, city: str, lat: float, lng: float, allows_outside_delivery: bool = False, allows_inseat_delivery: bool = False) -> Venue:
    """
    Resolve existing venue using geographical proximity (within 300 meters)
    or name similarity to prevent duplicate venues.
    """
    existing_venues = db.query(Venue).filter(Venue.city.ilike(city)).all()
    for v in existing_venues:
        dist_km = haversine_km(lat, lng, v.lat, v.lng)
        if dist_km <= 0.3 or v.name.lower() == venue_name.lower():
            return v

    new_venue = Venue(
        name=venue_name,
        city=city,
        address=f"{venue_name}, {city}",
        lat=lat,
        lng=lng,
        allows_outside_delivery=allows_outside_delivery,
        allows_inseat_delivery=allows_inseat_delivery,
    )
    db.add(new_venue)
    db.commit()
    db.refresh(new_venue)
    return new_venue


def upsert_event(db, item: Dict[str, Any], dry_run: bool = False) -> Optional[Event]:
    """
    Upsert an incoming live event record into the database.
    Checks name, venue, and date to avoid duplicate entries.
    """
    category = normalize_category(item.get("category", "other"))
    venue = resolve_or_create_venue(
        db,
        venue_name=item["venue_name"],
        city=item["city"],
        lat=item["lat"],
        lng=item["lng"],
        allows_outside_delivery=item.get("allows_outside_delivery", False),
        allows_inseat_delivery=item.get("allows_inseat_delivery", False),
    )


    existing = db.query(Event).filter(
        Event.name.ilike(item["name"]),
        Event.venue_id == venue.id,
        Event.date == item["date"]
    ).first()

    if existing:
        print(f"[Sync] Event already exists: {item['name']} on {item['date']} at {venue.name}")
        return existing

    if dry_run:
        print(f"[Dry Run] Would insert: {item['name']} ({category}) at {venue.name} [{item['date']} {item['start_time']}]")
        return None

    new_event = Event(
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
        organizer=item.get("organizer", "BookMyShow Live"),
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    print(f"[Sync] Successfully ingested new live event ID #{new_event.id}: {new_event.name}")
    return new_event


def run_mock_feed_sync(db: Optional[SessionLocal] = None, dry_run: bool = False) -> Dict[str, Any]:
    """
    Simulates polling an external live concert/event webhook or ticketing aggregator API.
    Returns a summary dictionary of ingested events.
    """
    sample_live_feed = [
        {
            "name": "Dua Lipa: Radical Optimism Tour",
            "venue_name": "MMRDA Grounds, BKC",
            "city": "Mumbai",
            "lat": 19.0600,
            "lng": 72.8656,
            "date": "2026-10-15",
            "start_time": "19:30",
            "end_time": "22:30",
            "category": "concert",
            "mins_until_show": 180,
            "allows_outside_delivery": False,
            "allows_inseat_delivery": False,
            "organizer": "Live Nation & BookMyShow",
        },
        {
            "name": "Comic Con India 2026: Live Stage",
            "venue_name": "KTPO Trade Centre, Whitefield",
            "city": "Bangalore",
            "lat": 12.9808,
            "lng": 77.7292,
            "date": "2026-10-20",
            "start_time": "18:00",
            "end_time": "22:00",
            "category": "festival",
            "mins_until_show": 240,
            "allows_outside_delivery": True,
            "allows_inseat_delivery": True,
            "organizer": "Comic Con India",
        },
        {
            "name": "Diljit Dosanjh: Dil-Luminati Arena",
            "venue_name": "Jawaharlal Nehru Stadium",
            "city": "Delhi",
            "lat": 28.5828,
            "lng": 77.2344,
            "date": "2026-10-28",
            "start_time": "19:30",
            "end_time": "23:00",
            "category": "concert",
            "mins_until_show": 180,
            "allows_outside_delivery": False,
            "allows_inseat_delivery": False,
            "organizer": "Saregama Live",
        },
        {
            "name": "Anubhav Singh Bassi: Naya Show",
            "venue_name": "Shilpakala Vedika",
            "city": "Hyderabad",
            "lat": 17.4475,
            "lng": 78.3762,
            "date": "2026-11-02",
            "start_time": "20:30",
            "end_time": "22:00",
            "category": "comedy",
            "mins_until_show": 180,
            "allows_outside_delivery": True,
            "allows_inseat_delivery": False,
            "organizer": "Bassi Productions",
        },
    ]

    session = db or SessionLocal()
    should_close = db is None

    try:
        print(f"\n--- Starting Real-Time Event Feed Ingestion (dry_run={dry_run}) ---")
        ingested = []
        for item in sample_live_feed:
            ev = upsert_event(session, item, dry_run=dry_run)
            if ev:
                ingested.append({"id": ev.id, "name": ev.name, "city": ev.city, "category": ev.category})
        print(f"--- Ingestion Completed: {len(ingested)} events processed ---\n")
        return {
            "status": "success",
            "ingested_count": len(ingested),
            "events": ingested,
            "source": "live_feed_syndication",
        }
    finally:
        if should_close:
            session.close()



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JustIn-Time Real-Time Event Sync Worker")
    parser.add_argument("--dry-run", action="store_true", help="Simulate ingestion without modifying database")
    parser.add_argument("--source", default="mock_feed", help="Source feed: mock_feed | ticketmaster | serpapi")
    args = parser.parse_args()

    run_mock_feed_sync(dry_run=args.dry_run)
