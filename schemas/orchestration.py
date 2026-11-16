"""
schemas/orchestration.py — Pydantic response schemas for the orchestration engine output.

These are the response shapes for:
  GET /bookings/{id}/orchestration  — the core engine result
  POST /bookings/{id}/lane-selection — user's lane choice

EXACT JSON RESPONSE SCHEMA for GET /bookings/{id}/orchestration:
─────────────────────────────────────────────────────────────────
{
  "booking_id":      integer,     // The booking that was evaluated
  "event_name":      string,
  "event_date":      string,      // "YYYY-MM-DD"
  "event_start_time": string,     // "HH:MM" (IST, 24h)
  "venue_name":      string,
  "mins_until_show": integer,     // Negative if show has already started
  "evaluated_at":    string,      // ISO 8601 UTC datetime

  "eligible_lanes": [             // Only lanes that passed ALL rules, ranked
    {
      "lane":        string,      // "bolt" | "dineout" | "scenes"
      "eligible":    true,
      "reason":      string,      // Human-readable engine decision
      "items_count": integer,     // How many options back this lane
      "items": [                  // Actual lane options (top 5 max)
        // For bolt: { id, name, vendor_type, menu_category, avg_prep_time_mins, stock_capacity }
        // For dineout: { id, name, cuisine, distance_km, avg_rating, price_for_two, avg_prep_time_mins }
        // For scenes: { id, name, category, distance_km, date, start_time, venue_name, entry_fee, available_spots }
      ]
    }
  ],

  "suppressed_lanes": [           // Lanes that failed at least one rule
    {
      "lane":        string,
      "eligible":    false,
      "reason":      string,      // Explicit suppression reason (for transparency/jury)
      "items_count": 0,
      "items":       null
    }
  ],

  "summary": string               // e.g. "2 of 3 lanes active — Dineout ✓, Scenes ✓ | Suppressed: Bolt ✗"
}

Ranking order (when eligible): bolt > dineout > scenes
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LaneDetail(BaseModel):
    """Details about a single lane — either eligible (with items) or suppressed (with reason)."""
    lane: str = Field(..., description="'bolt' | 'dineout' | 'scenes'")
    eligible: bool = Field(..., description="True = passed all rules and is offered to user")
    reason: str = Field(..., description="Human-readable engine decision explaining lane eligibility")
    items_count: Optional[int] = Field(None, description="Number of options backing this lane (0 if suppressed)")
    items: Optional[list] = Field(None, description="Top 5 lane options (null if suppressed)")


class OrchestrationResponse(BaseModel):
    """
    Core orchestration response — the rules engine output for a given booking.
    Shows both eligible lanes (ranked) and suppressed lanes (with reasons).
    """
    booking_id: int
    event_name: str
    event_date: str
    event_start_time: str
    venue_name: str
    mins_until_show: int
    evaluated_at: datetime

    # Ranked eligible lanes (only the ones that passed all rules)
    eligible_lanes: List[LaneDetail] = Field(
        description="Lanes that passed all rules, ranked by relevance"
    )

    # Suppressed lanes with reasons (transparency and auditability)
    suppressed_lanes: List[LaneDetail] = Field(
        description="Lanes filtered out and why — provides full transparency"
    )

    # Summary for quick overview
    summary: str = Field(
        description="Human-readable one-liner. e.g., '2 of 3 lanes active: Dineout ✓, Scenes ✓, Bolt ✗'"
    )


class LaneSelectionCreate(BaseModel):
    """Payload for recording a user's lane selection."""
    lane_selected: Optional[str] = Field(
        None,
        description="Lane the user selected: 'dineout' | 'scenes' | 'bolt' | null (skipped)"
    )
    completed: bool = Field(
        False,
        description="Did the user complete the action (book table / order food / register for event)?"
    )

    model_config = {"json_schema_extra": {
        "example": {
            "lane_selected": "dineout",
            "completed": True,
        }
    }}


class LaneSelectionResponse(BaseModel):
    """Confirmation after recording a lane selection."""
    metric_id: int
    booking_id: int
    lanes_shown: str
    lane_selected: Optional[str]
    completed: bool
    message: str
