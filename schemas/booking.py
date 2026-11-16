"""
schemas/booking.py — Pydantic schemas for Booking (ticket) create/read operations.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BookingCreate(BaseModel):
    user_id: str = Field(..., min_length=1, description="Mock user identifier")
    event_id: int = Field(..., gt=0)
    seat_section: Optional[str] = Field(None, description="e.g., Gold, Platinum, General")
    price_tier: Optional[str] = Field(None, description="premium | standard | economy")
    quantity: int = Field(1, ge=1, le=20)
    booking_amount: Optional[float] = Field(None, ge=0)

    model_config = {"json_schema_extra": {
        "example": {
            "user_id": "user_demo_001",
            "event_id": 1,
            "seat_section": "Gold",
            "price_tier": "premium",
            "quantity": 2,
            "booking_amount": 9998.0,
        }
    }}


class BookingRead(BaseModel):
    id: int
    user_id: str
    event_id: int
    seat_section: Optional[str]
    price_tier: Optional[str]
    quantity: int
    booking_amount: Optional[float]
    booked_at: datetime

    model_config = {"from_attributes": True}
