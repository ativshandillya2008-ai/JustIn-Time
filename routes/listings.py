"""
routes/listings.py — Lane data CRUD endpoints.

POST /restaurants    — Add a Dineout restaurant listing
GET  /restaurants    — List all restaurants
POST /scene-events   — Add a Scenes discovery event listing
GET  /scene-events   — List all scene events
POST /bolt-vendors   — Add an in-venue Bolt vendor
GET  /bolt-vendors   — List all Bolt vendors

NOTE: distance_from_venue is NOT stored on restaurant or scene records.
Distance is always computed at query time by the orchestration engine using
services/geo.py Haversine, against whichever venue's booking is being evaluated.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.venue import Venue
from models.dineout import DineoutRestaurant
from models.scene import SceneEvent
from models.bolt_vendor import BoltVendor
from schemas.dineout import DineoutRestaurantCreate, DineoutRestaurantRead
from schemas.scene import SceneEventCreate, SceneEventRead
from schemas.bolt_vendor import BoltVendorCreate, BoltVendorRead

router = APIRouter(tags=["Lane Listings"])


# ─── DINEOUT RESTAURANTS ────────────────────────────────────────────────

@router.post("/restaurants", response_model=DineoutRestaurantRead, status_code=status.HTTP_201_CREATED)
def create_restaurant(payload: DineoutRestaurantCreate, db: Session = Depends(get_db)):
    """
    Add a Dineout restaurant listing.

    Only lat/lng are needed — the orchestration engine computes distance
    from the booking's venue at query time using services/geo.py Haversine.
    """
    restaurant = DineoutRestaurant(**payload.model_dump())
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.get("/restaurants", response_model=list[DineoutRestaurantRead])
def list_restaurants(db: Session = Depends(get_db)):
    return db.query(DineoutRestaurant).all()


# ─── SCENE EVENTS ───────────────────────────────────────────────────────

@router.post("/scene-events", response_model=SceneEventRead, status_code=status.HTTP_201_CREATED)
def create_scene_event(payload: SceneEventCreate, db: Session = Depends(get_db)):
    """
    Add a Scenes discovery event listing.

    Only lat/lng are required — the orchestration engine computes distance
    from the booking's venue at query time using services/geo.py Haversine.
    The engine also checks category against CATEGORY_ADJACENCY to determine
    whether the scene adds discovery value over the booked event.
    """
    scene = SceneEvent(**payload.model_dump())
    db.add(scene)
    db.commit()
    db.refresh(scene)
    return scene


@router.get("/scene-events", response_model=list[SceneEventRead])
def list_scene_events(db: Session = Depends(get_db)):
    return db.query(SceneEvent).all()


# ─── BOLT VENDORS ────────────────────────────────────────────────────────

@router.post("/bolt-vendors", response_model=BoltVendorRead, status_code=status.HTTP_201_CREATED)
def create_bolt_vendor(payload: BoltVendorCreate, db: Session = Depends(get_db)):
    """
    Add an in-venue Bolt vendor (pop-up kitchen / food stall).

    The venue_id must reference an existing venue. Note: the orchestration engine
    checks venue.allows_inseat_delivery separately — the vendor record alone is
    not enough for Bolt to be eligible.
    """
    venue = db.query(Venue).filter(Venue.id == payload.venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue id={payload.venue_id} not found. Bolt vendors must be tied to a venue.",
        )

    vendor = BoltVendor(**payload.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/bolt-vendors", response_model=list[BoltVendorRead])
def list_bolt_vendors(db: Session = Depends(get_db)):
    return db.query(BoltVendor).all()
