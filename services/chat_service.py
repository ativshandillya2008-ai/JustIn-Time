"""
services/chat_service.py — AI Chatbot Service for JustIn-Time

Provides the conversational intelligence for the "JIT Concierge".
Grounded in live database context (events, venues, restaurants, scenes, bolt vendors, and bookings).
Supports Google Gemini (gemini-2.5-flash) with an automatic, pitch-safe local grounded NLP engine fallback.
"""

import os
import re
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from models.event import Event
from models.venue import Venue
from models.dineout import DineoutRestaurant
from models.scene import SceneEvent
from models.bolt_vendor import BoltVendor
from models.booking import Booking
from services.geo import haversine_km
from services.orchestration_engine import run_orchestration


SYSTEM_INSTRUCTION = """You are "JIT Concierge", the AI assistant for JustIn-Time — an orchestration platform connecting BookMyShow ticket intent with Swiggy ecosystem fulfillment (Dineout, Scenes, Bolt).

Core Purpose:
1. Help users discover nearby events, movies, concerts, stand-up comedy, and stadium matches.
2. Curate pre-show dining reservations (Swiggy Dineout) within realistic walking distance of the venue.
3. Recommend post-show discovery experiences (Swiggy Scenes) in adjacent categories (e.g., after a concert, an acoustic jam).
4. Explain in-seat stadium snack delivery (Swiggy Bolt).
5. Explain the JustIn-Time orchestration logic transparently — highlighting why certain lanes are eligible or suppressed (e.g. strict venue policies or rush-timing constraints) to prevent notification fatigue.

Tone & Style:
- Professional, energetic, concise, and helpful.
- Keep answers under 3-4 short paragraphs or bullet points.
- Ground all specific recommendations in the provided database context.
"""


def _build_context(db: Session, city: Optional[str], user_lat: Optional[float], user_lng: Optional[float], booking_id: Optional[int]) -> Dict[str, Any]:
    """Retrieve live database entities relevant to the user's location and active booking."""
    city_filter = city if city and city.lower() != "all" else None

    # 1. Events
    event_query = db.query(Event)
    if city_filter:
        event_query = event_query.filter(Event.city.ilike(f"%{city_filter}%"))
    events = event_query.limit(8).all()

    events_data = []
    for ev in events:
        dist = None
        if user_lat is not None and user_lng is not None and ev.lat is not None and ev.lng is not None:
            dist = haversine_km(user_lat, user_lng, ev.lat, ev.lng)
        events_data.append({
            "id": ev.id,
            "name": ev.name,
            "city": ev.city,
            "category": ev.category,
            "date": ev.date,
            "start_time": ev.start_time,
            "distance_km": dist,
        })
    if user_lat is not None and user_lng is not None:
        events_data.sort(key=lambda x: (x["distance_km"] if x["distance_km"] is not None else 9999))

    # 2. Dineout Restaurants
    rest_query = db.query(DineoutRestaurant)
    if city_filter:
        rest_query = rest_query.filter(DineoutRestaurant.city.ilike(f"%{city_filter}%"))
    restaurants = rest_query.limit(6).all()
    restaurants_data = [
        {
            "id": r.id,
            "name": r.name,
            "cuisine": r.cuisine,
            "rating": r.avg_rating,
            "price_for_two": r.price_for_two,
            "city": r.city,
        }
        for r in restaurants
    ]

    # 3. Scene Events
    scene_query = db.query(SceneEvent)
    if city_filter:
        scene_query = scene_query.filter(SceneEvent.city.ilike(f"%{city_filter}%"))
    scenes = scene_query.limit(5).all()
    scenes_data = [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "entry_fee": s.entry_fee,
            "city": s.city,
        }
        for s in scenes
    ]

    # 4. Booking & Orchestration Context
    booking_data = None
    orchestration_data = None
    if booking_id:
        b = db.query(Booking).filter(Booking.id == booking_id).first()
        if b:
            booking_data = {
                "id": b.id,
                "event_id": b.event_id,
                "seat_section": b.seat_section,
                "price_tier": b.price_tier,
                "user_id": b.user_id,
            }
            try:
                orch_resp = run_orchestration(b, db)
                orchestration_data = orch_resp.model_dump() if hasattr(orch_resp, 'model_dump') else orch_resp.dict()
            except Exception as e:
                pass

    return {
        "city": city_filter or "Current User City",
        "events": events_data,
        "restaurants": restaurants_data,
        "scenes": scenes_data,
        "booking": booking_data,
        "orchestration": orchestration_data,
    }


def _local_grounded_response(message: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pitch-safe local rule and intent engine.
    Ensures 100% uptime without external API dependency during pitch presentations.
    """
    msg = message.lower()
    city = context.get("city", "your city")
    events = context.get("events", [])
    restaurants = context.get("restaurants", [])
    scenes = context.get("scenes", [])
    booking = context.get("booking")
    orch = context.get("orchestration")

    # 1. Food & Dining (Dineout) intent — check first before generic "show"
    if any(k in msg for k in ["food", "dinner", "eat", "restaurant", "dine", "dineout", "table", "hungry", "pre-show", "lunch", "meal"]):
        if not restaurants:
            return {
                "reply": f"No restaurants found nearby in {city} yet. Check back once your location is verified!",
                "intent": "dining_recommendation",
                "suggested_actions": ["Find Events", "How does Dineout work?"],
                "relevant_items": [],
                "engine_source": "local_grounded_engine",
            }

        reply_lines = [
            f"🍽️ **Swiggy Dineout Curations for {city}**\n",
            "JustIn-Time routes high-intent ticket holders to verified pre-show tables with guaranteed seating:\n"
        ]
        relevant_items = []
        for r in restaurants[:4]:
            reply_lines.append(f"- **{r['name']}** ({r['cuisine']}) • ⭐ {r['rating']} • ₹{r['price_for_two']} for two")
            relevant_items.append({"type": "restaurant", **r})

        reply_lines.append("\n*Tip: The engine automatically checks timing buffers (>90 mins before show) so you never miss event gates.*")

        return {
            "reply": "\n".join(reply_lines),
            "intent": "dining_recommendation",
            "suggested_actions": ["View Events", "Why was Bolt suppressed?", "What is Swiggy Scenes?"],
            "relevant_items": relevant_items,
            "engine_source": "local_grounded_engine",
        }

    # 2. Nearest / Events discovery intent
    if any(k in msg for k in ["near me", "nearby", "event", "show", "concert", "comedy", "movie", "happening", "tonight", "weekend"]):
        if not events:
            return {
                "reply": f"I couldn't find any scheduled events right now in {city}. Try selecting another city or enabling GPS location!",
                "intent": "event_discovery",
                "suggested_actions": ["Switch to Mumbai", "Switch to Bangalore", "Explore Dineout"],
                "relevant_items": [],
                "engine_source": "local_grounded_engine",
            }
        
        reply_lines = [
            f"Here are top events currently scheduled near you in **{city}**:\n"
        ]
        relevant_items = []
        for ev in events[:4]:
            dist_str = f" • 📍 **{ev['distance_km']} km away**" if ev.get("distance_km") is not None else ""
            reply_lines.append(f"- **{ev['name']}** ({ev['category'].title()})\n  🕒 {ev['date']} @ {ev['start_time']} IST{dist_str}")
            relevant_items.append({"type": "event", **ev})

        reply_lines.append("\nYou can tap any event on screen to view the interactive IMAX / theater seat map and reserve tickets!")

        return {
            "reply": "\n".join(reply_lines),
            "intent": "event_discovery",
            "suggested_actions": [f"Pre-show dining for {events[0]['name']}", "Explain JustIn-Time Engine", "How does Bolt delivery work?"],
            "relevant_items": relevant_items,
            "engine_source": "local_grounded_engine",
        }

    # 3. Discovery Scenes intent
    if any(k in msg for k in ["scene", "scenes", "discovery", "party", "after", "hangout", "social"]):
        reply_lines = [
            f"✨ **Swiggy Scenes Local Discovery**\n",
            "Swiggy Scenes discovers category-adjacent activities before or after your main event:\n"
        ]
        relevant_items = []
        for s in scenes[:3]:
            fee_str = "Free Entry" if s['entry_fee'] == 0 else f"₹{s['entry_fee']}"
            reply_lines.append(f"- **{s['name']}** ({s['category'].title()}) • {fee_str}")
            relevant_items.append({"type": "scene", **s})

        reply_lines.append("\nOur category adjacency matrix pairs complementary vibes (e.g., concert → live acoustic jam, comedy → speakeasy social).")

        return {
            "reply": "\n".join(reply_lines),
            "intent": "scenes_discovery",
            "suggested_actions": ["Explore Dineout", "View Events", "Check Orchestration"],
            "relevant_items": relevant_items,
            "engine_source": "local_grounded_engine",
        }

    # 4. Bolt In-Seat Stadium Delivery intent
    if any(k in msg for k in ["bolt", "stadium", "seat drop", "delivery", "snack", "in-seat", "popcorn", "drink"]):
        return {
            "reply": (
                "⚡ **Swiggy Bolt — Zero-Friction In-Seat Delivery**\n\n"
                "Swiggy Bolt fulfills in-venue food and beverage directly to your ticket seat number:\n"
                "- **Fast Prep**: Average preparation time under 8-10 minutes from in-venue stalls.\n"
                "- **Zero Line Wait**: No missing key concert songs or crucial match moments.\n"
                "- **Strict Policy Filter**: The engine automatically suppresses Bolt if the venue prohibits outside food or in-seat drop!"
            ),
            "intent": "bolt_explanation",
            "suggested_actions": ["Why was Bolt suppressed for Coldplay?", "Show Nearby Events", "How Dineout Works"],
            "relevant_items": [],
            "engine_source": "local_grounded_engine",
        }

    # 5. Orchestration Engine & Suppression Logic intent
    if any(k in msg for k in ["orchestrat", "engine", "suppress", "rule", "why", "how does", "jit", "moat"]):
        if orch:
            eligible = [l["lane"].upper() for l in orch.get("eligible_lanes", [])]
            suppressed = [l["lane"].upper() for l in orch.get("suppressed_lanes", [])]
            return {
                "reply": (
                    f"⚙️ **Live Orchestration Evaluation for Booking #{orch.get('booking_id', 'Active')}**\n\n"
                    f"**Summary**: {orch.get('summary', 'Engine evaluated')}\n"
                    f"- **Active Lanes**: {', '.join(eligible) if eligible else 'None'}\n"
                    f"- **Suppressed Lanes**: {', '.join(suppressed) if suppressed else 'None'}\n\n"
                    "**Why Suppression Matters**: Traditional push notifications suffer from low conversion because they spam users indiscriminately. JustIn-Time's rules engine enforces venue policy, distance buffers (<3km), and timing gates to ensure only 100% relevant lanes appear."
                ),
                "intent": "orchestration_explanation",
                "suggested_actions": ["View Pilot Dashboard", "Explore Active Lanes", "Browse More Events"],
                "relevant_items": [],
                "engine_source": "local_grounded_engine",
            }

        return {
            "reply": (
                "🎯 **How the JustIn-Time Orchestration Engine Works**\n\n"
                "1. **Intent Interception**: The instant a user reserves a BookMyShow ticket, JustIn-Time extracts event category, venue GPS coordinates, and showtime.\n"
                "2. **Multi-Constraint Rules Engine**:\n"
                "   - **Dineout**: Requires `mins_until_show >= 90` and restaurant `< 3.0 km`.\n"
                "   - **Scenes**: Evaluates category adjacency (e.g. concert ↔ festival) and distance `< 5.0 km`.\n"
                "   - **Bolt**: Requires venue policy `allows_outside_food == True` or dedicated in-seat runner agreement.\n"
                "3. **Outcome**: Higher conversion (~3× vs cold push) with zero spam."
            ),
            "intent": "orchestration_explanation",
            "suggested_actions": ["View Events Near Me", "Check Pilot Metrics", "Pre-show Dining"],
            "relevant_items": [],
            "engine_source": "local_grounded_engine",
        }

    # Default pitch-friendly assistant answer
    return {
        "reply": (
            f"👋 Hello! I am the **JIT Concierge** for JustIn-Time.\n\n"
            f"I help you explore events in **{city}**, recommend pre-show dining (Swiggy Dineout), "
            "surface nearby scene gatherings (Swiggy Scenes), and coordinate in-seat stadium snacks (Swiggy Bolt).\n\n"
            "What can I help you with today?"
        ),
        "intent": "general_inquiry",
        "suggested_actions": ["What events are near me?", "Suggest dinner near venue", "How does JustIn-Time work?"],
        "relevant_items": [],
        "engine_source": "local_grounded_engine",
    }


def generate_chat_reply(
    message: str,
    db: Session,
    city: Optional[str] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    booking_id: Optional[int] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Main entry point for generating chat responses.
    Uses Google Gemini if GEMINI_API_KEY is available; falls back cleanly to the local grounded engine.
    """
    context = _build_context(db, city, user_lat, user_lng, booking_id)

    api_key = os.getenv("GEMINI_API_KEY")

    if api_key:
        try:
            from google import genai

            client = genai.Client(api_key=api_key)

            prompt_parts = [
                f"User City: {context['city']}",
                f"User Coordinates: ({user_lat}, {user_lng})" if user_lat and user_lng else "User Coordinates: Not provided",
                f"Available Events: {context['events']}",
                f"Nearby Dineout Restaurants: {context['restaurants']}",
                f"Nearby Scenes: {context['scenes']}",
            ]
            if context.get("booking"):
                prompt_parts.append(f"Active Booking: {context['booking']}")
            if context.get("orchestration"):
                prompt_parts.append(f"Orchestration Decision: {context['orchestration']}")

            prompt_parts.append(f"\nUser Query: {message}")

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents="\n".join(prompt_parts),
                config={"system_instruction": SYSTEM_INSTRUCTION},
            )

            if response and response.text:
                return {
                    "reply": response.text.strip(),
                    "intent": "ai_assistant",
                    "suggested_actions": ["What events are near me?", "Suggest pre-show dinner", "How does JustIn-Time work?"],
                    "relevant_items": [{"type": "event", **e} for e in context["events"][:2]],
                    "engine_source": "gemini",
                }
        except Exception as e:
            print(f"[ChatService] Gemini API invocation encountered error: {e}. Gracefully falling back to local grounded engine.")

    # Local Grounded Engine
    return _local_grounded_response(message, context)
