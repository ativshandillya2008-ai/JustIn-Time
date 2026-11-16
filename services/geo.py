"""
services/geo.py — Geospatial utility functions.

Provides the Haversine formula for computing straight-line distance between
two lat/lng coordinate pairs. Used by the orchestration engine to determine
which restaurants, scene events, and bolt vendors are within radius thresholds.
"""

import math


EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Compute the great-circle distance in kilometres between two points
    on Earth given their latitude and longitude in decimal degrees.

    Args:
        lat1, lng1: Coordinates of point 1
        lat2, lng2: Coordinates of point 2

    Returns:
        Distance in kilometres (float), rounded to 3 decimal places.
    """
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(EARTH_RADIUS_KM * c, 3)


def is_within_radius(
    venue_lat: float, venue_lng: float,
    target_lat: float, target_lng: float,
    radius_km: float
) -> bool:
    """Returns True if the target coordinates are within radius_km of the venue."""
    return haversine_km(venue_lat, venue_lng, target_lat, target_lng) <= radius_km
