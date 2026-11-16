"""
schemas/dineout.py — Pydantic schemas for DineoutRestaurant listings.

Note: distance_from_venue_km is NOT a stored field — it is computed dynamically
at query time by the orchestration engine using the Haversine formula. The
orchestration response includes the computed distance per restaurant.
"""

from pydantic import BaseModel, Field
from typing import Optional


class DineoutRestaurantCreate(BaseModel):
    name: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    address: Optional[str] = None
    cuisine: Optional[str] = None
    lat: float = Field(..., description="Restaurant latitude — distance computed dynamically from venue at query time")
    lng: float = Field(..., description="Restaurant longitude")
    avg_prep_time_mins: Optional[int] = Field(30, ge=0)
    accepts_reservations: bool = True
    avg_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    price_for_two: Optional[int] = Field(None, ge=0)
    dineout_commission_pct: Optional[float] = Field(15.0, ge=0)

    model_config = {"json_schema_extra": {
        "example": {
            "name": "The Bombay Canteen",
            "city": "Mumbai",
            "cuisine": "Modern Indian",
            "lat": 19.0015,
            "lng": 72.8297,
            "avg_rating": 4.6,
            "price_for_two": 2400,
        }
    }}


class DineoutRestaurantRead(DineoutRestaurantCreate):
    id: int

    model_config = {"from_attributes": True}
