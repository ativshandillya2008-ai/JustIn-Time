"""
models/pilot_metric.py — PilotMetric ORM model.

Records every lane interaction for the pilot success dashboard:
which lanes were shown, which (if any) was selected, and whether
the user completed the action (table booked, order placed, etc.).

Pilot success metrics tracked:
- Dineout: table intent rate + completion rate
- Scenes: qualified discovery rate
- Bolt: conversion rate + on-time delivery rate (on-time is future field)
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime, timezone
from database import Base


class PilotMetric(Base):
    __tablename__ = "pilot_metrics"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, nullable=False, index=True)

    # Which lanes were shown to the user (comma-separated)
    lanes_shown = Column(String, nullable=False)   # e.g., "bolt,dineout"

    # Which lane the user selected (null = none selected / skipped)
    lane_selected = Column(String, nullable=True)  # "bolt" | "dineout" | "scenes" | null

    # Whether the user completed the action in the selected lane
    completed = Column(Boolean, default=False, nullable=True)

    # Future extensibility — on-time delivery for Bolt
    on_time_delivery = Column(Boolean, nullable=True)

    # Timestamp
    shown_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    selected_at = Column(DateTime(timezone=True), nullable=True)
