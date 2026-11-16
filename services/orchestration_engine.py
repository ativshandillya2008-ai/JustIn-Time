"""
services/orchestration_engine.py — THE RULES ENGINE

This is the core "moat" of JustIn-Time.

Given a booking (which references an event at a venue), this engine evaluates
three independent lane decisions — Dineout, Scenes, Bolt — and returns a ranked
list of eligible suggestions with human-readable reasoning for each decision.

Operating principle: "Curate for relevance. Useful beats exhaustive."
The engine SUPPRESSES lanes rather than showing everything.

Distances are ALWAYS computed at query time using services/geo.py Haversine.
No cached distances are used. All event/scene times are treated as IST (UTC+5:30).

Lane evaluation order (independent rules, then ranked at the end):
  1. BOLT     — in-venue delivery (zero-friction when eligible)
  2. DINEOUT  — pre-show dining (timing-sensitive)
  3. SCENES   — discovery events (supplementary)

Suppression rules:
  - Bolt:    venue.allows_inseat_delivery is False  OR  no active vendors at venue
  - Dineout: < 90 min until showtime  OR  no restaurants within 1.5 km of venue
  - Scenes:  no nearby events (within 2 km) in a ±3-hour window  OR
             scene category not in CATEGORY_ADJACENCY[event.category]
             (i.e., same/non-discovery-adjacent category = no value added)
"""

from datetime import datetime, timezone, timedelta, date as date_type, time as time_type
from typing import Optional
from sqlalchemy.orm import Session

from models.event import Event
from models.venue import Venue
from models.booking import Booking
from models.dineout import DineoutRestaurant
from models.scene import SceneEvent
from models.bolt_vendor import BoltVendor
from models.orchestration import OrchestrationResult
from services.geo import haversine_km
from schemas.orchestration import LaneDetail, OrchestrationResponse

# ─────────────────────────────────────────────
# Configurable rule thresholds
# ─────────────────────────────────────────────
DINEOUT_MIN_MINS_BEFORE_SHOW = 90      # Must have this many minutes before showtime
DINEOUT_MAX_RADIUS_KM = 1.5            # Restaurants must be within this distance (km)
SCENES_MAX_RADIUS_KM = 2.0             # Scene events must be within this distance (km)
SCENES_WINDOW_HOURS = 3                # ±N hours window around show start time
BOLT_REQUIRE_INSEAT = True             # If True, requires allows_inseat_delivery

# ─────────────────────────────────────────────────────────────────────────
# CATEGORY ADJACENCY MATRIX
#
# Defines which Scenes categories provide genuine discovery value for each
# booked event category. A scene is only eligible if its category is in the
# adjacency set for the event's category.
#
# Design principle:
#   - Same category as the booked event → no discovery value (user already going to one)
#   - Semantically adjacent/complementary → included (expands the evening meaningfully)
#   - Unrelated or contradictory → excluded (noise)
#
# Event categories:  movie | concert | sport | comedy | theatre | other
# Scene categories:  comedy | dj | art | workshop | other
# ─────────────────────────────────────────────────────────────────────────
CATEGORY_ADJACENCY: dict[str, set[str]] = {
    # Concert: night-out energy → pre-show comedy, DJ warm-up, art/pop-up markets fit well
    "concert":  {"comedy", "dj", "art", "workshop", "other"},

    # Movie: casual evening → comedy and art feel natural; DJ feels incongruent
    "movie":    {"comedy", "art", "workshop", "other"},

    # Sport: high-energy crowd → DJ and comedy fit; art/workshop feel off-brand
    "sport":    {"comedy", "dj", "other"},

    # Comedy: person already going to a comedy show → surfacing another comedy event
    # adds zero discovery value; DJ or art nearby rounds out the evening
    "comedy":   {"dj", "art", "workshop", "other"},

    # Theatre: intellectual/cultural outing → art and workshop fit; DJ feels jarring
    "theatre":  {"comedy", "art", "workshop", "other"},

    # Other/catch-all: be liberal, surface anything
    "other":    {"comedy", "dj", "art", "workshop", "other"},
}


def _parse_event_datetime(event: Event) -> datetime:
    """
    Parse an event's date + start_time into a timezone-aware UTC datetime.
    Event times are treated as IST (UTC+5:30) then converted to UTC.
    """
    IST = timezone(timedelta(hours=5, minutes=30))
    year, month, day = (int(p) for p in event.date.split("-"))
    hour, minute = (int(p) for p in event.start_time.split(":"))
    naive_dt = datetime(year, month, day, hour, minute, 0)
    ist_dt = naive_dt.replace(tzinfo=IST)
    return ist_dt.astimezone(timezone.utc)


def _minutes_until_show(show_start_utc: datetime) -> int:
    """Returns minutes from now until the show starts. Negative if already started."""
    now = datetime.now(timezone.utc)
    delta = show_start_utc - now
    return int(delta.total_seconds() / 60)


def _scene_datetime(scene: SceneEvent) -> datetime:
    """Parse a SceneEvent's date + start_time into a UTC-aware datetime (assumes IST)."""
    IST = timezone(timedelta(hours=5, minutes=30))
    year, month, day = (int(p) for p in scene.date.split("-"))
    hour, minute = (int(p) for p in scene.start_time.split(":"))
    naive_dt = datetime(year, month, day, hour, minute, 0)
    return naive_dt.replace(tzinfo=IST).astimezone(timezone.utc)


# ──────────────────────────────────────────────────────────
# LANE 1: BOLT — In-venue delivery
# Rule: venue.allows_inseat_delivery == True AND has active vendors
# ──────────────────────────────────────────────────────────

def _evaluate_bolt(
    venue: Venue,
    db: Session
) -> LaneDetail:
    """Evaluate whether Bolt (in-venue delivery) should be offered."""

    # Rule 1: Check venue food policy
    if not venue.allows_inseat_delivery:
        return LaneDetail(
            lane="bolt",
            eligible=False,
            reason=f"Bolt suppressed: venue policy does not allow in-seat delivery at '{venue.name}'.",
            items_count=0,
        )

    # Rule 2: Check if any active vendors exist at this venue
    vendors = (
        db.query(BoltVendor)
        .filter(BoltVendor.venue_id == venue.id, BoltVendor.is_active == True)
        .all()
    )

    if not vendors:
        return LaneDetail(
            lane="bolt",
            eligible=False,
            reason=f"Bolt suppressed: venue allows delivery but no active Bolt vendors found at '{venue.name}'.",
            items_count=0,
        )

    vendor_names = ", ".join(v.name for v in vendors[:3])
    return LaneDetail(
        lane="bolt",
        eligible=True,
        reason=f"Bolt suggested: in-venue delivery enabled at '{venue.name}', {len(vendors)} vendor(s) available ({vendor_names}).",
        items_count=len(vendors),
        items=[
            {
                "id": v.id,
                "name": v.name,
                "vendor_type": v.vendor_type,
                "menu_category": v.menu_category,
                "avg_prep_time_mins": v.avg_prep_time_mins,
                "stock_capacity": v.stock_capacity,
            }
            for v in vendors
        ],
    )


# ──────────────────────────────────────────────────────────
# LANE 2: DINEOUT — Pre-show dining
# Rules: >= 90 min before show AND restaurants within 1.5 km
# ──────────────────────────────────────────────────────────

def _evaluate_dineout(
    event: Event,
    venue: Venue,
    mins_until_show: int,
    db: Session,
) -> LaneDetail:
    """Evaluate whether Dineout (restaurant reservation) should be offered."""

    # Rule 1: Time gate — must have enough time to actually dine
    if mins_until_show < DINEOUT_MIN_MINS_BEFORE_SHOW:
        return LaneDetail(
            lane="dineout",
            eligible=False,
            reason=(
                f"Dineout suppressed: only {mins_until_show} min until showtime "
                f"(minimum {DINEOUT_MIN_MINS_BEFORE_SHOW} min required for a meal)."
                + (" Show may have already started." if mins_until_show <= 0 else "")
            ),
            items_count=0,
        )

    # Rule 2: Proximity — find restaurants within radius of the venue
    if venue.lat is None or venue.lng is None:
        return LaneDetail(
            lane="dineout",
            eligible=False,
            reason="Dineout suppressed: venue location coordinates are not set.",
            items_count=0,
        )

    all_restaurants = db.query(DineoutRestaurant).filter(
        DineoutRestaurant.accepts_reservations == True
    ).all()

    nearby = []
    for r in all_restaurants:
        dist = haversine_km(venue.lat, venue.lng, r.lat, r.lng)
        if dist <= DINEOUT_MAX_RADIUS_KM:
            nearby.append((dist, r))

    # Sort by distance ascending
    nearby.sort(key=lambda x: x[0])

    if not nearby:
        return LaneDetail(
            lane="dineout",
            eligible=False,
            reason=(
                f"Dineout suppressed: {mins_until_show} min until show but "
                f"no restaurants found within {DINEOUT_MAX_RADIUS_KM} km of '{venue.name}'."
            ),
            items_count=0,
        )

    return LaneDetail(
        lane="dineout",
        eligible=True,
        reason=(
            f"Dineout suggested: {mins_until_show} min before showtime, "
            f"{len(nearby)} restaurant(s) within {DINEOUT_MAX_RADIUS_KM} km of '{venue.name}'."
        ),
        items_count=len(nearby),
        items=[
            {
                "id": r.id,
                "name": r.name,
                "cuisine": r.cuisine,
                "distance_km": round(dist, 2),
                "avg_rating": r.avg_rating,
                "price_for_two": r.price_for_two,
                "avg_prep_time_mins": r.avg_prep_time_mins,
            }
            for dist, r in nearby[:5]  # Return top 5 closest
        ],
    )


# ──────────────────────────────────────────────────────────
# LANE 3: SCENES — Nearby discovery events
# Rules: events within 2 km AND within ±3h of show start
#        AND different category from the booked event
# ──────────────────────────────────────────────────────────

def _evaluate_scenes(
    event: Event,
    venue: Venue,
    show_start_utc: datetime,
    db: Session,
) -> LaneDetail:
    """Evaluate whether Scenes (nearby discovery events) should be offered."""

    if venue.lat is None or venue.lng is None:
        return LaneDetail(
            lane="scenes",
            eligible=False,
            reason="Scenes suppressed: venue location coordinates are not set.",
            items_count=0,
        )

    window_start = show_start_utc - timedelta(hours=SCENES_WINDOW_HOURS)
    window_end = show_start_utc + timedelta(hours=SCENES_WINDOW_HOURS)

    all_scenes = db.query(SceneEvent).all()

    nearby_in_window = []
    for s in all_scenes:
        # Distance check
        dist = haversine_km(venue.lat, venue.lng, s.lat, s.lng)
        if dist > SCENES_MAX_RADIUS_KM:
            continue

        # Time window check
        try:
            scene_start = _scene_datetime(s)
        except Exception:
            continue
        if not (window_start <= scene_start <= window_end):
            continue

        nearby_in_window.append((dist, s))

    if not nearby_in_window:
        return LaneDetail(
            lane="scenes",
            eligible=False,
            reason=(
                f"Scenes suppressed: no discovery events found within {SCENES_MAX_RADIUS_KM} km "
                f"of '{venue.name}' in the ±{SCENES_WINDOW_HOURS}h window around showtime."
            ),
            items_count=0,
        )

    # Filter using CATEGORY_ADJACENCY — only keep scenes whose category is
    # genuinely complementary to the booked event (not same, not incongruent).
    # A scene must be in the adjacency set for the event's category to pass.
    event_cat = event.category.lower()
    adjacent_cats = CATEGORY_ADJACENCY.get(event_cat, set())  # fallback: empty = suppress all

    discovery_events = [
        (d, s) for d, s in nearby_in_window
        if s.category.lower() in adjacent_cats
    ]

    if not discovery_events:
        found_cats = sorted(set(s.category for _, s in nearby_in_window))
        return LaneDetail(
            lane="scenes",
            eligible=False,
            reason=(
                f"Scenes suppressed: {len(nearby_in_window)} nearby event(s) found "
                f"({', '.join(found_cats)}) but none are discovery-adjacent to '{event_cat}'. "
                f"Adjacent scene categories for '{event_cat}': {sorted(adjacent_cats) or 'none defined'}."
            ),
            items_count=0,
        )

    discovery_events.sort(key=lambda x: x[0])

    return LaneDetail(
        lane="scenes",
        eligible=True,
        reason=(
            f"Scenes suggested: {len(discovery_events)} discovery event(s) nearby within "
            f"{SCENES_MAX_RADIUS_KM} km in the ±{SCENES_WINDOW_HOURS}h window — "
            f"category-adjacent to '{event_cat}' per adjacency rules."
        ),
        items_count=len(discovery_events),
        items=[
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "distance_km": round(dist, 2),
                "date": s.date,
                "start_time": s.start_time,
                "venue_name": s.venue_name,
                "entry_fee": s.entry_fee,
                "available_spots": s.available_spots,
            }
            for dist, s in discovery_events[:5]  # Top 5 closest/relevant
        ],
    )


# ──────────────────────────────────────────────────────────
# MAIN ORCHESTRATION FUNCTION
# ──────────────────────────────────────────────────────────

def run_orchestration(booking: Booking, db: Session) -> OrchestrationResponse:
    """
    Run the full orchestration engine for a given booking.

    1. Load the event and venue from the booking.
    2. Run each lane's independent rule evaluation.
    3. Rank eligible lanes: Bolt > Dineout > Scenes.
    4. Persist the result to orchestration_results table.
    5. Return a structured OrchestrationResponse.

    Raises:
        ValueError: If the event or venue referenced by the booking is not found.
    """

    # ── Load dependencies ──────────────────────────────────
    event = db.query(Event).filter(Event.id == booking.event_id).first()
    if not event:
        raise ValueError(f"Event with id={booking.event_id} not found.")

    venue = db.query(Venue).filter(Venue.id == event.venue_id).first()
    if not venue:
        raise ValueError(f"Venue with id={event.venue_id} not found.")

    # ── Compute time context ───────────────────────────────
    show_start_utc = _parse_event_datetime(event)
    if event.simulated_mins_until_show is not None:
        mins_until_show = event.simulated_mins_until_show
    else:
        mins_until_show = _minutes_until_show(show_start_utc)
    evaluated_at = datetime.now(timezone.utc)

    # ── Evaluate each lane independently ──────────────────
    bolt_result = _evaluate_bolt(venue, db)
    dineout_result = _evaluate_dineout(event, venue, mins_until_show, db)
    scenes_result = _evaluate_scenes(event, venue, show_start_utc, db)

    all_lanes = [bolt_result, dineout_result, scenes_result]

    # ── Separate and rank ─────────────────────────────────
    # Ranking order: Bolt (zero-friction) > Dineout (high-intent) > Scenes (discovery)
    RANK_ORDER = {"bolt": 0, "dineout": 1, "scenes": 2}
    eligible = sorted(
        [l for l in all_lanes if l.eligible],
        key=lambda l: RANK_ORDER.get(l.lane, 99)
    )
    suppressed = [l for l in all_lanes if not l.eligible]

    # ── Build summary ──────────────────────────────────────
    eligible_str = ", ".join(f"{l.lane.capitalize()} ✓" for l in eligible) or "none"
    suppressed_str = ", ".join(f"{l.lane.capitalize()} ✗" for l in suppressed) or "none"
    if eligible:
        summary = f"{len(eligible)} of 3 lanes active — {eligible_str}"
        if suppressed:
            summary += f" | Suppressed: {suppressed_str}"
    else:
        summary = "0 of 3 lanes active — all lanes suppressed for this booking."

    # ── Persist orchestration result ───────────────────────
    ranked_lane_str = ",".join(l.lane for l in eligible)
    result_record = OrchestrationResult(
        booking_id=booking.id,
        dineout_eligible=dineout_result.eligible,
        scenes_eligible=scenes_result.eligible,
        bolt_eligible=bolt_result.eligible,
        dineout_reason=dineout_result.reason,
        scenes_reason=scenes_result.reason,
        bolt_reason=bolt_result.reason,
        mins_until_show=mins_until_show,
        dineout_count=dineout_result.items_count,
        scenes_count=scenes_result.items_count,
        bolt_vendor_count=bolt_result.items_count,
        ranked_lanes=ranked_lane_str,
    )
    db.add(result_record)
    db.commit()

    return OrchestrationResponse(
        booking_id=booking.id,
        event_name=event.name,
        event_date=event.date,
        event_start_time=event.start_time,
        venue_name=venue.name,
        mins_until_show=mins_until_show,
        evaluated_at=evaluated_at,
        eligible_lanes=eligible,
        suppressed_lanes=suppressed,
        summary=summary,
    )
