"""
routes/bookings.py — Booking endpoints (the trigger events).

POST /bookings                       — Simulate a user booking a ticket
GET  /bookings                       — List all bookings
GET  /bookings/{id}                  — Get a single booking
GET  /bookings/{id}/orchestration    — [CORE] Run rules engine, return lane suggestions
POST /bookings/{id}/lane-selection   — Record user's lane choice (pilot metrics)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database import get_db
from models.booking import Booking
from models.event import Event
from models.orchestration import OrchestrationResult
from models.pilot_metric import PilotMetric
from schemas.booking import BookingCreate, BookingRead
from schemas.orchestration import OrchestrationResponse, LaneSelectionCreate, LaneSelectionResponse
from services.orchestration_engine import run_orchestration

router = APIRouter(prefix="/bookings", tags=["Bookings & Orchestration"])


# ─── POST /bookings ──────────────────────────────────────────────────────────

@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    """
    Simulate a user booking a ticket — the intent signal that triggers JustIn-Time.

    Validates that the referenced event exists before creating the booking.
    After creation, call GET /bookings/{id}/orchestration to get lane suggestions.
    """
    # Validate event exists
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event id={payload.event_id} not found. Cannot book a ticket for a non-existent event.",
        )

    booking = Booking(
        user_id=payload.user_id,
        event_id=payload.event_id,
        seat_section=payload.seat_section,
        price_tier=payload.price_tier,
        quantity=payload.quantity,
        booking_amount=payload.booking_amount,
        booked_at=datetime.now(timezone.utc),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# ─── GET /bookings ────────────────────────────────────────────────────────────

@router.get("", response_model=list[BookingRead])
def list_bookings(db: Session = Depends(get_db)):
    """List all bookings."""
    return db.query(Booking).all()


@router.get("/{booking_id}", response_model=BookingRead)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    """Get a single booking by ID."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Booking {booking_id} not found.")
    return booking


# ─── GET /bookings/{id}/orchestration ────────────────────────────────────────
# *** THIS IS THE CORE ENDPOINT ***

@router.get("/{booking_id}/orchestration", response_model=OrchestrationResponse)
def get_orchestration(booking_id: int, db: Session = Depends(get_db)):
    """
    [CORE ENDPOINT] Run the JustIn-Time rules engine for a booking.

    Given a booking ID, this endpoint:
    1. Loads the event and venue context.
    2. Evaluates all 3 Swiggy lanes (Bolt, Dineout, Scenes) against the rules.
    3. Suppresses irrelevant lanes (bad timing / venue policy / no nearby options).
    4. Returns ranked eligible lanes + suppressed lanes with human-readable reasons.
    5. Logs the result to orchestration_results for audit and analytics.

    This is the orchestration engine — the product's actual moat.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {booking_id} not found.",
        )

    try:
        result = run_orchestration(booking, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    return result


# ─── POST /bookings/{id}/lane-selection ──────────────────────────────────────

@router.post("/{booking_id}/lane-selection", response_model=LaneSelectionResponse)
def record_lane_selection(
    booking_id: int,
    payload: LaneSelectionCreate,
    db: Session = Depends(get_db),
):
    """
    Record which lane the user selected (or that they skipped).

    This feeds the pilot success metrics dashboard:
    - Dineout: table intent + completion rate
    - Scenes: qualified discovery rate
    - Bolt: conversion + on-time delivery rate

    Requires that orchestration has been run first for this booking
    (so we know which lanes were shown).
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Booking {booking_id} not found.")

    # Get the latest orchestration result to know which lanes were shown
    orch_result = (
        db.query(OrchestrationResult)
        .filter(OrchestrationResult.booking_id == booking_id)
        .order_by(OrchestrationResult.created_at.desc())
        .first()
    )

    if not orch_result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No orchestration result found for booking {booking_id}. "
                "Run GET /bookings/{id}/orchestration first."
            ),
        )

    # Validate that selected lane was actually shown
    lanes_shown = orch_result.ranked_lanes or ""
    if payload.lane_selected and payload.lane_selected not in lanes_shown.split(","):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Lane '{payload.lane_selected}' was not shown for this booking. "
                f"Shown lanes: [{lanes_shown}]. Cannot select a suppressed lane."
            ),
        )

    metric = PilotMetric(
        booking_id=booking_id,
        lanes_shown=lanes_shown,
        lane_selected=payload.lane_selected,
        completed=payload.completed,
        selected_at=datetime.now(timezone.utc) if payload.lane_selected else None,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)

    return LaneSelectionResponse(
        metric_id=metric.id,
        booking_id=booking_id,
        lanes_shown=lanes_shown,
        lane_selected=payload.lane_selected,
        completed=payload.completed,
        message=(
            f"Lane selection recorded: '{payload.lane_selected}' selected, "
            f"completed={payload.completed}."
            if payload.lane_selected
            else "No lane selected (user skipped). Recorded for dropout tracking."
        ),
    )
