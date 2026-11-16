"""
models/event.py — Event ORM model.

Represents a BookMyShow-style event. The event's start_time, end_time, and
category are key inputs to the Dineout (timing) and Scenes (category match) rules.
"""

from sqlalchemy import Column, Integer, String, Float, Date, Time
from database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    venue_id = Column(Integer, nullable=False)  # FK to venues.id (soft ref for simplicity)
    city = Column(String, nullable=False)

    # Date and time — stored as separate fields for easy time arithmetic
    date = Column(String, nullable=False)        # ISO format: "YYYY-MM-DD"
    start_time = Column(String, nullable=False)  # "HH:MM" 24h
    end_time = Column(String, nullable=True)     # "HH:MM" 24h — nullable (some events unknown duration)

    # Category drives Scenes lane filtering (no point surfacing same-category events)
    category = Column(String, nullable=False)    # movie | concert | sport | comedy | theatre | other

    # Geolocation (denormalised from venue for quick lookup)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    # Simulation lead time (minutes before show at booking time)
    # Allows realistic evening showtimes (e.g. 19:30, 20:30) while preserving
    # precise lead time test scenarios (e.g. 180 min, 240 min, 45 min rush booking)
    simulated_mins_until_show = Column(Integer, nullable=True)

    # Business metadata
    total_seats = Column(Integer, nullable=True)
    language = Column(String, nullable=True)     # For movies
    organizer = Column(String, nullable=True)    # Event organiser name
