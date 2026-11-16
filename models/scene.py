"""
models/scene.py — Scenes event listing ORM model.

Represents nearby discovery events (comedy shows, DJ nights, pop-up markets, etc.)
that can be surfaced as Scenes lane suggestions. IMPORTANT: distance from a venue
is NEVER stored here — always computed at query time via services/geo.py Haversine.
"""

from sqlalchemy import Column, Integer, String, Float
from database import Base


class SceneEvent(Base):
    __tablename__ = "scene_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    venue_name = Column(String, nullable=True)
    address = Column(String, nullable=True)

    # Category — used in CATEGORY_ADJACENCY lookup in orchestration_engine.py
    category = Column(String, nullable=False)    # comedy | dj | art | workshop | other

    # Date and time
    date = Column(String, nullable=False)         # ISO "YYYY-MM-DD"
    start_time = Column(String, nullable=False)   # "HH:MM" 24h
    end_time = Column(String, nullable=True)      # "HH:MM" 24h

    # Geolocation — distance computed dynamically at query time, never stored
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Pricing / discovery metadata
    entry_fee = Column(Integer, nullable=True)         # INR, 0 = free
    available_spots = Column(Integer, nullable=True)

    # Business model (featured discovery fee — modelled, not enforced)
    scenes_featured_fee = Column(Float, nullable=True, default=0.0)
