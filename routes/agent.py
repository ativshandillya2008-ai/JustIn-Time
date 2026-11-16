"""
routes/agent.py — Agentic AI Scout API Endpoints for JustIn-Time

Provides endpoints for monitoring, triggering, and conversing with the
autonomous BookMyShow & Swiggy background agent.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from database import get_db
from services.agentic_scout import (
    AgenticScoutBrain,
    BookMyShowScoutEngine,
    SwiggyScoutEngine,
    telemetry,
)

router = APIRouter(prefix="/agent", tags=["Agentic AI Scout"])


class ScoutRequest(BaseModel):
    city: Optional[str] = Field("Mumbai", description="Target city for scouting")
    lat: Optional[float] = Field(None, description="GPS Latitude")
    lng: Optional[float] = Field(None, description="GPS Longitude")
    sync_to_database: bool = Field(True, description="Sync discovered entities into SQLite")


class AgentQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Instruction or question for the background agent")
    city: Optional[str] = "Mumbai"
    lat: Optional[float] = None
    lng: Optional[float] = None


@router.get("/status", summary="Get live agent telemetry and background status")
def get_agent_status():
    """
    Returns real-time background status of the Agentic AI Scout:
    - Activity state (IDLE, SCOUTING_BMS, SCOUTING_SWIGGY, REASONING, SYNCED)
    - Active mission & last execution timestamp
    - Discovery metrics (Total BMS cinemas, Swiggy restaurants, DB syncs)
    - Accuracy confidence score
    - Recent telemetry execution log trace
    """
    return telemetry.get_snapshot()


@router.post("/scout", summary="Trigger an immediate autonomous scout mission")
async def trigger_scout(payload: ScoutRequest):
    """
    Instructs the Agentic AI to scout BookMyShow and Swiggy for the specified city/coordinates.
    Synthesizes venue policies and pre-show dining buffers and optionally commits to the database.
    """
    result = await AgenticScoutBrain.execute_mission(
        city=payload.city,
        lat=payload.lat,
        lng=payload.lng,
        sync_to_database=payload.sync_to_database,
    )
    return result


@router.post("/query", summary="Send an instruction or prompt to the Agentic Scout")
async def query_agent(payload: AgentQueryRequest):
    """
    Natural language console for the Agentic AI.
    Executes targeted BookMyShow / Swiggy probes based on the prompt.
    """
    q = payload.query.lower()
    city = payload.city or "Mumbai"
    lat = payload.lat or 19.0760
    lng = payload.lng or 72.8777

    telemetry.log("AGENT_THOUGHT", f"User query received: '{payload.query}' for {city}")

    # Determine intent
    is_movie = any(k in q for k in ["movie", "cinema", "theatre", "theater", "show", "bms", "bookmyshow", "film", "screen", "imax"])
    is_food = any(k in q for k in ["food", "restaurant", "swiggy", "dine", "eat", "snack", "bolt", "dinner", "lunch", "biryani", "pizza"])

    bms_results = []
    swiggy_results = []

    if is_movie or not is_food:
        telemetry.status = "SCOUTING_BMS"
        bms_results = await BookMyShowScoutEngine.scout_city_cinemas(city, lat, lng, limit=6)

    if is_food or not is_movie:
        telemetry.status = "SCOUTING_SWIGGY"
        swiggy_results = await SwiggyScoutEngine.scout_live_restaurants(lat, lng, city, limit=8)

    telemetry.status = "SYNCED"

    # Generate synthesized agent reply
    response_lines = [
        f"🤖 **Agentic AI Scout Report for {city.title()}**\n",
    ]

    if bms_results:
        response_lines.append(f"🎬 **BookMyShow Live Cinemas ({len(bms_results)} verified):**")
        for b in bms_results[:3]:
            dist = f" • 📍 {b['distance_km']} km away" if b.get('distance_km') is not None else ""
            response_lines.append(f"- **{b['name']}**{dist}\n  Address: {b['address'][:65]}... (MTicket: {'Yes' if b['mticket'] else 'No'})")
        response_lines.append("")

    if swiggy_results:
        response_lines.append(f"🛵 **Swiggy Live Dining ({len(swiggy_results)} verified):**")
        for s in swiggy_results[:3]:
            response_lines.append(f"- **{s['name']}** ({', '.join(s['cuisines'][:2])}) • ⭐ {s['avg_rating']} • {s['cost_for_two_str']} (⚡ {s['delivery_sla']})")
        response_lines.append("")

    response_lines.append("⚡ *All entities cross-verified with physical GPS coordinates and pre-show timing buffers.*")

    return {
        "reply": "\n".join(response_lines),
        "bms_venues": bms_results,
        "swiggy_restaurants": swiggy_results,
        "telemetry": telemetry.get_snapshot(),
    }
