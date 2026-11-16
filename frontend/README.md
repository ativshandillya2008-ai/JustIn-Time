# JustIn-Time — Frontend Application

Modern React frontend for **JustIn-Time** — an orchestration engine combining BookMyShow's ticket purchasing experience with Swiggy's dining, food delivery, and local discovery ecosystem.

---

## Quick Start

### 1. Ensure Backend is Running
In the root directory `/Users/ativshandilly/Desktop/JustIn-Time`:
```bash
source venv/bin/activate
uvicorn main:app --reload
# Backend runs at http://localhost:8000
```

### 2. Run the Frontend
In `/Users/ativshandilly/Desktop/JustIn-Time/frontend`:
```bash
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

---

## Demo Flow Walkthrough

1. **Sign In**: Navigate to `http://localhost:5173/auth` and click **"Continue as Guest"** (or use Google Sign-In if Firebase credentials are provided in `.env`).
2. **Event Browsing**: Browse the 3 seeded events (Coldplay Concert, KBC Live, Bassi Comedy).
3. **Interactive Seat Selection**: Click an event, pick up to 4 seats on the live stadium seat map, and click **"Confirm Booking & Intercept"**.
4. **The Orchestration Reveal**:
   - Ticket stub is generated with real BookMyShow intent token.
   - Live engine results are retrieved from `GET /bookings/{id}/orchestration`.
   - **Eligible Lanes** are displayed with real restaurants, discovery events, and food stalls.
   - **Suppressed Lanes** are displayed with human-readable engine logic explaining why they were filtered (e.g. venue food policy or time-to-show buffer).
   - Click **"Explore <Lane>"** to select an offer (`POST /bookings/{id}/lane-selection`) or click **"Skip Offers"**.
5. **Pilot Metrics Dashboard**: View live conversion rates, shown vs. selected vs. completed ratios, and dropout rates at `http://localhost:5173/pilot-dashboard`.
6. **One-Click Demo Reset**: Click **"Reset Data"** in the top navigation bar at any time to re-seed the clean baseline (`POST /seed`).
