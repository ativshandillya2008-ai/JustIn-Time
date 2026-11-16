"""
routes/events.py — Event CRUD endpoints.
POST /events — Create a new event (seed / manual test data)
GET  /events  — List all events
GET  /events/{id} — Get a single event
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.event import Event
from models.venue import Venue
from schemas.event import EventCreate, EventRead

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    """
    Create a mock event (for seeding test data).

    The event must reference an existing venue_id.
    If the venue has coordinates and none are provided for the event,
    the venue's coordinates are automatically inherited.
    """
    # Validate the venue exists
    venue = db.query(Venue).filter(Venue.id == payload.venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id={payload.venue_id} not found. Create the venue first.",
        )

    # Inherit venue coordinates if not provided
    lat = payload.lat if payload.lat is not None else venue.lat
    lng = payload.lng if payload.lng is not None else venue.lng

    event = Event(
        name=payload.name,
        venue_id=payload.venue_id,
        city=payload.city,
        date=payload.date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        category=payload.category,
        lat=lat,
        lng=lng,
        total_seats=payload.total_seats,
        language=payload.language,
        organizer=payload.organizer,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


from typing import Optional
from services.geo import haversine_km


@router.get("", response_model=list[EventRead])
def list_events(
    city: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
    q: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    List events with optional city, category, text search, and GPS proximity filtering.
    When lat and lng are provided, events are annotated with distance_km and sorted closest first.
    """
    query = db.query(Event)

    if city and city.lower() != "all":
        query = query.filter(Event.city.ilike(f"%{city.strip()}%"))

    if category and category.lower() != "all":
        query = query.filter(Event.category.ilike(f"%{category.strip()}%"))

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            (Event.name.ilike(search_pattern)) |
            (Event.organizer.ilike(search_pattern)) |
            (Event.category.ilike(search_pattern))
        )

    events = query.all()

    # Convert to EventRead-compatible dicts or objects with distance_km
    results = []
    has_coords = lat is not None and lng is not None

    for ev in events:
        ev_lat = ev.lat
        ev_lng = ev.lng
        dist = None

        if has_coords and ev_lat is not None and ev_lng is not None:
            dist = haversine_km(lat, lng, ev_lat, ev_lng)
            if radius_km is not None and dist > radius_km:
                continue

        # Create response dictionary
        item = {
            "id": ev.id,
            "name": ev.name,
            "venue_id": ev.venue_id,
            "city": ev.city,
            "date": ev.date,
            "start_time": ev.start_time,
            "end_time": ev.end_time,
            "category": ev.category,
            "lat": ev.lat,
            "lng": ev.lng,
            "simulated_mins_until_show": ev.simulated_mins_until_show,
            "total_seats": ev.total_seats,
            "language": ev.language,
            "organizer": ev.organizer,
            "distance_km": dist,
        }
        results.append(item)

    # If coordinates provided, sort by distance (closest first)
    if has_coords:
        results.sort(key=lambda x: (x["distance_km"] if x["distance_km"] is not None else 99999))

    return results


from services.event_sync_worker import run_mock_feed_sync


@router.post("/sync")
def sync_live_events(dry_run: bool = False, db: Session = Depends(get_db)):
    """
    Trigger live event feed ingestion (simulates Ticketmaster / SerpApi / live syndication feeds).
    Performs entity deduplication, venue proximity resolution, and upserts new concerts/shows into the DB.
    """
    result = run_mock_feed_sync(db=db, dry_run=dry_run)
    return result


@router.get("/{event_id}", response_model=EventRead)
def get_event(
    event_id: int,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Get a single event by ID, optionally calculating distance if lat/lng are provided."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Event {event_id} not found.")

    dist = None
    if lat is not None and lng is not None and event.lat is not None and event.lng is not None:
        dist = haversine_km(lat, lng, event.lat, event.lng)

    item = {
        "id": event.id,
        "name": event.name,
        "venue_id": event.venue_id,
        "city": event.city,
        "date": event.date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "category": event.category,
        "lat": event.lat,
        "lng": event.lng,
        "simulated_mins_until_show": event.simulated_mins_until_show,
        "total_seats": event.total_seats,
        "language": event.language,
        "organizer": event.organizer,
        "distance_km": dist,
    }
    return item

