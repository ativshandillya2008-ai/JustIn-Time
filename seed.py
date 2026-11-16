#!/usr/bin/env python3
"""
seed.py — Standalone seed script (CLI alternative to POST /seed)

Usage:
    python seed.py

This script can be run without the server running — it directly
calls the database to populate mock data. Equivalent to POST /seed.
"""

import sys
import os

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
import models  # Register all ORM models

from routes.seed import seed_database


def main():
    print("JustIn-Time — Database Seeder")
    print("=" * 40)

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        result = seed_database(db)
        print(f"\n✅ {result['message']}")
        print("\nSeeded data:")
        for k, v in result["seeded"].items():
            print(f"  {k}: {v}")
        print("\nDemo scenarios:")
        for city, scenarios in result.get("demo_scenarios", {}).items():
            print(f"  {city.upper()}:")
            for booking_key, text in scenarios.items():
                print(f"    - [{booking_key}] {text}")
        print("\nNext step:")
        print("  curl http://localhost:8000/bookings/1/orchestration  (Scenario A: Mumbai)")
        print("  curl http://localhost:8000/bookings/4/orchestration  (Scenario A: Bangalore)")
        print("  curl http://localhost:8000/bookings/6/orchestration  (Scenario C: Bangalore)")
    except Exception as e:
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
