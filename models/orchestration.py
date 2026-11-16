"""
models/orchestration.py — OrchestrationResult ORM model.

Logs every orchestration engine run: which lanes were eligible, which were
suppressed, and the human-readable reasoning for each decision.
This is the audit trail for the engine — records real-time orchestration decisions.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime, timezone
from database import Base


class OrchestrationResult(Base):
    __tablename__ = "orchestration_results"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, nullable=False, index=True)

    # Lane eligibility flags
    dineout_eligible = Column(Boolean, default=False)
    scenes_eligible = Column(Boolean, default=False)
    bolt_eligible = Column(Boolean, default=False)

    # Human-readable reasoning for each lane decision (include OR suppress)
    dineout_reason = Column(Text, nullable=True)
    scenes_reason = Column(Text, nullable=True)
    bolt_reason = Column(Text, nullable=True)

    # Snapshot of key inputs at evaluation time (for auditability)
    mins_until_show = Column(Integer, nullable=True)        # Time until event start
    dineout_count = Column(Integer, nullable=True)          # Restaurants found in radius
    scenes_count = Column(Integer, nullable=True)           # Scene events found in window
    bolt_vendor_count = Column(Integer, nullable=True)      # Bolt vendors at venue

    # Ranked lane order (comma-separated, e.g., "bolt,dineout,scenes")
    ranked_lanes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
