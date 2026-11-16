"""
models/booking.py — Booking/Ticket ORM model.

Represents a user's ticket booking — this is the "intent signal" that
triggers the JustIn-Time orchestration engine.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime, timezone
from database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)     # Mock user ID (no auth yet)
    event_id = Column(Integer, nullable=False)   # FK to events.id (soft ref)

    # Ticket details
    seat_section = Column(String, nullable=True)   # e.g., "Gold", "Platinum", "General"
    price_tier = Column(String, nullable=True)     # e.g., "premium", "standard", "economy"
    quantity = Column(Integer, default=1, nullable=False)

    # Timestamp — used for "time until show" calculation in orchestration
    booked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Business model fields (extensibility — not actively computed)
    booking_amount = Column(Float, nullable=True)  # Total booking value in INR
    platform_fee = Column(Float, nullable=True)    # BookMyShow origination fee
    bms_origination_share = Column(Float, nullable=True)  # Revenue share % (model only)
