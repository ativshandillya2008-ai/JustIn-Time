"""
schemas/event.py — Pydantic schemas for Event create/read operations.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


class EventCreate(BaseModel):
    name: str = Field(..., min_length=1)
    venue_id: int = Field(..., gt=0)
    city: str = Field(..., min_length=1)
    date: str = Field(..., description="ISO date: YYYY-MM-DD")
    start_time: str = Field(..., description="24h time: HH:MM")
    end_time: Optional[str] = Field(None, description="24h time: HH:MM")
    category: str = Field(..., description="movie | concert | sport | comedy | theatre | other")
    lat: Optional[float] = None
    lng: Optional[float] = None
    simulated_mins_until_show: Optional[int] = Field(None, description="Optional lead time in minutes before show at booking time")
    total_seats: Optional[int] = None
    language: Optional[str] = None
    organizer: Optional[str] = None

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("date must be in YYYY-MM-DD format")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("time must be in HH:MM format")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        allowed = {"movie", "concert", "sport", "comedy", "theatre", "other"}
        if v.lower() not in allowed:
            raise ValueError(f"category must be one of: {', '.join(sorted(allowed))}")
        return v.lower()

    model_config = {"json_schema_extra": {
        "example": {
            "name": "Coldplay Music of the Spheres",
            "venue_id": 1,
            "city": "Mumbai",
            "date": "2026-09-27",
            "start_time": "20:00",
            "end_time": "23:00",
            "category": "concert",
        }
    }}


class EventRead(EventCreate):
    id: int
    distance_km: Optional[float] = Field(None, description="Distance from user's coordinates in km, if lat/lng supplied")

    model_config = {"from_attributes": True}
