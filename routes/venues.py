"""
routes/venues.py — Venue CRUD endpoints.
POST /venues — Create a venue with food policy
GET  /venues  — List all venues
GET  /venues/{id} — Get a single venue
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.venue import Venue
from schemas.venue import VenueCreate, VenueRead

router = APIRouter(prefix="/venues", tags=["Venues"])


@router.post("", response_model=VenueRead, status_code=status.HTTP_201_CREATED)
def create_venue(payload: VenueCreate, db: Session = Depends(get_db)):
    """
    Create a mock venue with food policy.

    The food policy (allows_outside_delivery, allows_inseat_delivery)
    directly determines Bolt lane eligibility in the orchestration engine.
    """
    venue = Venue(**payload.model_dump())
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue


@router.get("", response_model=list[VenueRead])
def list_venues(db: Session = Depends(get_db)):
    """List all venues."""
    return db.query(Venue).all()


@router.get("/{venue_id}", response_model=VenueRead)
def get_venue(venue_id: int, db: Session = Depends(get_db)):
    """Get a single venue by ID."""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Venue {venue_id} not found.")
    return venue
