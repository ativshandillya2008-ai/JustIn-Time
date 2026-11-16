"""
models/dineout.py — Dineout Restaurant listing ORM model.

Each entry represents a restaurant that may be surfaced as a Dineout lane
suggestion. IMPORTANT: distance from a venue is NEVER stored here — it is
always computed at query time by the orchestration engine using the
Haversine formula in services/geo.py. This prevents stale data and ensures
the engine always reflects reality when venue coordinates change.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base


class DineoutRestaurant(Base):
    __tablename__ = "dineout_restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(String, nullable=True)
    cuisine = Column(String, nullable=True)      # e.g., "North Indian", "Italian", "Multi-cuisine"

    # Geolocation — the only location truth; distance is computed on the fly
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Operational fields
    avg_prep_time_mins = Column(Integer, nullable=True, default=30)
    accepts_reservations = Column(Boolean, default=True)
    avg_rating = Column(Float, nullable=True)
    price_for_two = Column(Integer, nullable=True)   # INR

    # Business model (commission — modelled, not enforced)
    dineout_commission_pct = Column(Float, nullable=True, default=15.0)
