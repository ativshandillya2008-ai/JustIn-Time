"""
schemas/venue.py — Pydantic schemas for Venue create/read operations.
"""

from pydantic import BaseModel, Field
from typing import Optional


class VenueCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Venue name")
    city: str = Field(..., min_length=1)
    address: Optional[str] = None
    lat: float = Field(..., description="Latitude (decimal degrees)")
    lng: float = Field(..., description="Longitude (decimal degrees)")
    allows_outside_delivery: bool = Field(False, description="Venue permits food delivery from outside")
    allows_inseat_delivery: bool = Field(False, description="Venue permits in-seat/in-venue food delivery")
    capacity: Optional[int] = Field(None, ge=1)
    partner_tier: Optional[str] = None

    model_config = {"json_schema_extra": {
        "example": {
            "name": "DY Patil Stadium",
            "city": "Mumbai",
            "address": "Sector 7, Nerul, Navi Mumbai",
            "lat": 19.0449,
            "lng": 73.0185,
            "allows_outside_delivery": False,
            "allows_inseat_delivery": False,
            "capacity": 55000,
        }
    }}


class VenueRead(VenueCreate):
    id: int

    model_config = {"from_attributes": True}
