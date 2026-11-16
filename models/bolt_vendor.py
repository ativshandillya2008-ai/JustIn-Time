"""
models/bolt_vendor.py — Bolt in-venue vendor/pop-up ORM model.

Represents vendors operating INSIDE a specific venue (food stalls, pop-up kitchens).
Bolt is only offered when the venue's food policy allows in-seat delivery AND
at least one vendor is active for that venue.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base


class BoltVendor(Base):
    __tablename__ = "bolt_vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    venue_id = Column(Integer, nullable=False)   # FK to venues.id — must be in-venue

    # Vendor details
    vendor_type = Column(String, nullable=True)  # e.g., "food_stall", "pop_up_kitchen", "bar"
    menu_category = Column(String, nullable=True)  # e.g., "snacks", "beverages", "meals"

    # Operational fields — used in Bolt rule evaluation
    stock_capacity = Column(Integer, nullable=True)   # Max orders per session
    avg_prep_time_mins = Column(Integer, nullable=True, default=10)
    is_active = Column(Boolean, default=True)

    # Business model (delivery economics — modelled, not enforced)
    bolt_delivery_fee = Column(Float, nullable=True, default=0.0)   # INR per order
    instamart_economics_share = Column(Float, nullable=True)        # % share
