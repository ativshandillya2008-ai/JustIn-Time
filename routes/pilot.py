"""
routes/pilot.py — Pilot metrics dashboard endpoint.

GET /pilot-metrics — Return aggregated stats per lane for the pilot dashboard.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Any, Dict

from database import get_db
from models.pilot_metric import PilotMetric
from models.orchestration import OrchestrationResult

router = APIRouter(prefix="/pilot-metrics", tags=["Pilot Metrics"])


@router.get("")
def get_pilot_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Return aggregated pilot success metrics per lane.

    Tracks:
    - Dineout: table intent rate + completion rate
    - Scenes: qualified discovery rate
    - Bolt: conversion rate (on-time delivery rate is a future field)

    Also returns overall funnel stats: total bookings orchestrated,
    total lane selections made, overall conversion rate.
    """
    all_metrics = db.query(PilotMetric).all()

    # Count total orchestration runs (each unique booking that ran the engine)
    total_orchestrations = db.query(func.count(OrchestrationResult.id)).scalar() or 0

    # Per-lane aggregation
    lane_stats: Dict[str, Dict] = {
        "bolt": {"shown": 0, "selected": 0, "completed": 0},
        "dineout": {"shown": 0, "selected": 0, "completed": 0},
        "scenes": {"shown": 0, "selected": 0, "completed": 0},
    }

    total_selections = 0
    total_skipped = 0

    for m in all_metrics:
        shown_lanes = [l.strip() for l in m.lanes_shown.split(",") if l.strip()]

        # Count "shown" for each lane that appeared in this interaction
        for lane in shown_lanes:
            if lane in lane_stats:
                lane_stats[lane]["shown"] += 1

        # Count selection and completion
        if m.lane_selected and m.lane_selected in lane_stats:
            lane_stats[m.lane_selected]["selected"] += 1
            total_selections += 1
            if m.completed:
                lane_stats[m.lane_selected]["completed"] += 1
        elif not m.lane_selected:
            total_skipped += 1

    # Compute rates
    def safe_rate(numerator: int, denominator: int) -> float:
        return round(numerator / denominator * 100, 1) if denominator > 0 else 0.0

    result = {
        "summary": {
            "total_orchestrations_run": total_orchestrations,
            "total_lane_interactions": len(all_metrics),
            "total_selections": total_selections,
            "total_skipped": total_skipped,
            "overall_selection_rate_pct": safe_rate(total_selections, len(all_metrics)),
        },
        "lanes": {
            "bolt": {
                "times_shown": lane_stats["bolt"]["shown"],
                "times_selected": lane_stats["bolt"]["selected"],
                "times_completed": lane_stats["bolt"]["completed"],
                "selection_rate_pct": safe_rate(
                    lane_stats["bolt"]["selected"], lane_stats["bolt"]["shown"]
                ),
                "completion_rate_pct": safe_rate(
                    lane_stats["bolt"]["completed"], lane_stats["bolt"]["selected"]
                ),
                "pilot_metric": "conversion + on-time delivery rate",
            },
            "dineout": {
                "times_shown": lane_stats["dineout"]["shown"],
                "times_selected": lane_stats["dineout"]["selected"],
                "times_completed": lane_stats["dineout"]["completed"],
                "selection_rate_pct": safe_rate(
                    lane_stats["dineout"]["selected"], lane_stats["dineout"]["shown"]
                ),
                "completion_rate_pct": safe_rate(
                    lane_stats["dineout"]["completed"], lane_stats["dineout"]["selected"]
                ),
                "pilot_metric": "table intent rate + completion rate",
            },
            "scenes": {
                "times_shown": lane_stats["scenes"]["shown"],
                "times_selected": lane_stats["scenes"]["selected"],
                "times_completed": lane_stats["scenes"]["completed"],
                "selection_rate_pct": safe_rate(
                    lane_stats["scenes"]["selected"], lane_stats["scenes"]["shown"]
                ),
                "completion_rate_pct": safe_rate(
                    lane_stats["scenes"]["completed"], lane_stats["scenes"]["selected"]
                ),
                "pilot_metric": "qualified discovery rate",
            },
        },
    }

    return result
