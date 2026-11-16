"""
schemas/scene.py — Pydantic schemas for SceneEvent listings.

Note: distance_from_venue_km is NOT a stored field — always computed at
query time by the orchestration engine via services/geo.py Haversine.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


class SceneEventCreate(BaseModel):
    name: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    venue_name: Optional[str] = None
    address: Optional[str] = None
    category: str = Field(..., description="comedy | dj | art | workshop | other")
    date: str = Field(..., description="YYYY-MM-DD")
    start_time: str = Field(..., description="HH:MM (24h, IST)")
    end_time: Optional[str] = None
    lat: float = Field(..., description="Latitude — distance from venue computed dynamically at query time")
    lng: float = Field(..., description="Longitude")
    entry_fee: Optional[int] = Field(None, ge=0)
    available_spots: Optional[int] = Field(None, ge=0)
    scenes_featured_fee: Optional[float] = Field(0.0, ge=0)

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("date must be YYYY-MM-DD")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("time must be HH:MM")
        return v

    model_config = {"json_schema_extra": {
        "example": {
            "name": "Sahil Shah: The Comeback",
            "city": "Mumbai",
            "category": "comedy",
            "date": "2026-09-27",
            "start_time": "18:00",
            "end_time": "20:00",
            "lat": 19.0461,
            "lng": 73.0195,
            "entry_fee": 499,
        }
    }}


class SceneEventRead(SceneEventCreate):
    id: int

    model_config = {"from_attributes": True}
