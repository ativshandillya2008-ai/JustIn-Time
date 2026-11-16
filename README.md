# JustIn-Time — Live Entertainment & Dining Orchestration Platform

> **Live Intelligent Orchestration Platform**: Bridges live entertainment discovery & ticketing (**BookMyShow**) with instant hyper-local food delivery and dining (**Swiggy**). As visitors explore events and book tickets, JustIn-Time automatically orchestrates pre-show dining, in-seat cinema snacks, and post-event experiences tailored to venue food policies, real-time showtimes, and proximity.

---

## Overview

JustIn-Time transforms event ticket bookings into unified entertainment and dining experiences. When a visitor selects an event or movie ticket, the platform captures this intent signal and intelligently routes the user to the best fulfillment options:

1. **Pre-Show Dining (Swiggy Dineout)**: For visitors with sufficient lead time before the show, recommends verified partner restaurants within walking distance of the venue.
2. **In-Venue F&B (Scenes & Cinema Concessions)**: For venues allowing outside or in-seat delivery, provides instant in-seat snacks and concession pre-orders so attendees skip the intermission lines.
3. **Hyper-Local Delivery (Swiggy Bolt & Quick Commerce)**: Rapid doorstep and pickup delivery for pre-event gatherings and post-event meals.

---

## Key Features

- **Event Discovery & Exploration**: Browse concerts, comedy shows, movies, sports, and festivals across major metros (Bangalore, Mumbai, Delhi, Hyderabad, Chennai) with real-time GPS location detection.
- **BookMyShow Cinema Experience**:
  - Full-width hero banner carousels and portrait event cards.
  - Interactive language & format selector (`Hindi`, `English`, `2D`, `DOLBY CINEMA 2D`, `3D`, `IMAX 3D`).
  - BMS-style **"How many seats?"** selector with dynamic vehicle illustrations (scooter, motorcycle, auto, car, bus) and tier pricing.
  - Authentic cinema tiered seat layout with luxury **Recliners (₹660)**, **Prime & Picture Perfect (₹330–₹400)**, **Extra Legroom (₹400)**, and **Classic Plus (₹300)**.
  - Dynamic showtime-specific occupancy: unique booked and available seat distributions for every timing slot.
- **"Grab a Bite!" Cinema F&B**:
  - Cinema concession food ordering with real item images, Veg badges, and calorie/allergen specifications.
  - Popcorn (Salted, Cheese, Caramel), Beverages (Pepsi), Nachos, Sandwiches, and Combos with live cart calculation.
- **Swiggy Restaurant Marketplace**:
  - Complete restaurant catalog with multi-cuisine menus (Coastal, North Indian, South Indian, Italian).
  - Live 2-column menu with item counters, cart sidebar, delivery address selector, and simulated payment methods.
- **Autonomous Orchestration Engine**:
  - Real-time rule evaluation examining venue delivery permissions, remaining time until show, and geographic radius.
  - Automated suppression explanation for ineligible fulfillment lanes to maintain full transparency.
- **Pilot & Executive Dashboard**:
  - Analytics measuring conversion rates, intent capture, and lane distribution metrics.
- **AI Concierge**:
  - Built-in live chatbot widget assisting visitors with event discovery, seating recommendations, and food pairings.

---

## Architecture & Codebase

```
JustIn-Time/
├── main.py                         # FastAPI production entrypoint
├── database.py                     # SQLAlchemy database configuration
├── requirements.txt                # Python dependencies
├── seed.py                         # Database initialization & catalog population
│
├── models/                         # SQLAlchemy ORM models
│   ├── venue.py                    # Venues with food policies & GPS coordinates
│   ├── event.py                    # Live events and movies
│   ├── booking.py                  # Ticket bookings (intent signals)
│   ├── dineout.py                  # Swiggy Dineout restaurant listings
│   ├── scene.py                    # Discovery and scene events
│   ├── bolt_vendor.py              # In-venue food vendors
│   ├── orchestration.py            # Orchestration execution audit logs
│   └── pilot_metric.py             # User interaction analytics
│
├── schemas/                        # Pydantic validation schemas
│   ├── event.py
│   ├── venue.py
│   ├── booking.py
│   └── orchestration.py
│
├── routes/                         # REST API endpoints
│   ├── events.py                   # GET /events, POST /events
│   ├── venues.py                   # GET /venues, POST /venues
│   ├── listings.py                 # GET /restaurants, /scene-events, /bolt-vendors
│   ├── bookings.py                 # POST /bookings, GET /bookings/{id}/orchestration
│   ├── pilot.py                    # GET /pilot-metrics
│   └── seed.py                     # POST /seed (database refresh)
│
├── services/
│   ├── geo.py                      # Haversine distance calculations
│   ├── event_sync.py               # Live event synchronization service
│   └── orchestration_engine.py     # Production rules engine
│
└── frontend/                       # React 18 + Vite frontend
    ├── src/
    │   ├── api/client.js           # Centralized API client
    │   ├── contexts/               # CityContext & AuthContext
    │   ├── screens/
    │   │   ├── EventListScreen.jsx # Event discovery & detail views
    │   │   ├── SeatMapScreen.jsx   # BMS cinema seat layout & F&B ordering
    │   │   ├── FoodOrderScreen.jsx # Swiggy food ordering marketplace
    │   │   ├── OrchestrationScreen # Fulfillment lane reveal & activation
    │   │   ├── PilotDashboard.jsx  # Performance & metrics dashboard
    │   │   └── AuthScreen.jsx      # Authentication & guest access
    │   └── components/             # Reusable UI components & modals
    └── package.json
```

**Technology Stack**:
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, SQLite, Uvicorn, Pydantic V2
- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS Design System

---

## Setup & Running Locally

### 1. Backend Setup
```bash
# Navigate to project root
cd JustIn-Time

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn main:app --reload --port 8000
```
- API Base URL: **http://localhost:8000**
- Interactive Swagger Documentation: **http://localhost:8000/docs**

### 2. Frontend Setup
```bash
# In a new terminal window:
cd JustIn-Time/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- Web Application: **http://localhost:5173**

---

## API Reference

### Events & Discovery
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/events` | List events with optional filters (`city`, `category`, `lat`, `lng`, `q`) |
| `GET` | `/events/{id}` | Get event details with distance from user coordinates |
| `POST` | `/events` | Create a new event |
| `POST` | `/events/sync` | Trigger live event feed synchronization |

### Venues
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/venues` | List venues with delivery policies (`allows_inseat_delivery`, `allows_outside_delivery`) |
| `GET` | `/venues/{id}` | Get venue details |

### Bookings & Orchestration Engine
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/bookings` | Create ticket booking (generates intent signal) |
| `GET` | `/bookings/{id}` | Retrieve booking details |
| `GET` | `/bookings/{id}/orchestration` | **Core Engine**: Evaluates rules and returns eligible fulfillment lanes |
| `POST` | `/bookings/{id}/lane-selection` | Record user lane choice and update fulfillment metrics |

### Food & Listings
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/restaurants` | List Dineout partner restaurants with cuisine and distance |
| `GET` | `/scene-events` | List discovery events in proximity |
| `GET` | `/bolt-vendors` | List in-venue concession vendors |

### Analytics & AI
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/pilot-metrics` | Retrieve platform conversion and engagement analytics |
| `POST` | `/chat` | Interactive AI concierge query |
| `POST` | `/seed` | Reset and populate baseline catalog |

---

## Orchestration Rules Engine

The orchestration engine assesses three core variables upon every booking:
1. **Timing Buffer**: Minutes remaining until event start time.
2. **Venue Policy**: Whether the venue permits outside food or in-seat delivery.
3. **Proximity**: Walking distance radius to nearby partner venues.

| Fulfillment Lane | Activation Criteria | Suppression Conditions |
|---|---|---|
| **Bolt (In-Venue)** | `venue.allows_inseat_delivery == True` AND active vendor at venue | In-seat delivery prohibited or no vendors |
| **Dineout (Pre-Show Dining)** | `≥ 90 min` before showtime AND `≥ 1` partner restaurant within **1.5 km** | `< 90 min` to show or no nearby restaurants |
| **Scenes (Post-Event Discovery)** | `≥ 1` event within **2.0 km** in `±3h window` with non-competing category | No events in window or all same category |

---

## Production Deployment Notes

1. **Environment Variables**:
   - `VITE_API_BASE_URL`: Sets the backend API origin for frontend client requests (defaults to `http://localhost:8000`).
   - `DATABASE_URL`: Production SQL connection string (PostgreSQL/MySQL/SQLite).
2. **CORS Configuration**:
   - Configured in `main.py`. In staging and production environments, specify authorized origins in `allow_origins`.
3. **Unified Full-Stack Serving**:
   - The FastAPI backend directly serves the compiled frontend single-page application at `http://localhost:8000`.
   - Browser navigation to `http://localhost:8000/`, `/events`, `/auth`, `/food`, `/seats/*`, and `/pilot-dashboard` displays the interactive website directly, while API and background queries access the JSON endpoints.
4. **Local Development**:
   ```bash
   # Run Backend API & Web Server (http://localhost:8000)
   uvicorn main:app --reload

   # Or run Frontend with Hot Reloading (http://localhost:5173)
   cd frontend && npm run dev
   ```
