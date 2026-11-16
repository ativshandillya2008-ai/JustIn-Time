"""
models/venue.py — Venue ORM model.

Tracks the physical venue for an event, including its food/delivery policy
which is the key input for the Bolt lane decision in the orchestration engine.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(String, nullable=True)

    # Geolocation
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Food policy — drives Bolt lane eligibility
    allows_outside_delivery = Column(Boolean, default=False, nullable=False)
    allows_inseat_delivery = Column(Boolean, default=False, nullable=False)

    # Venue metadata
    capacity = Column(Integer, nullable=True)

    # Business model field (not enforced yet — extensibility)
    partner_tier = Column(String, nullable=True)  # e.g., "premium", "standard"
