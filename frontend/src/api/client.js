/**
 * src/api/client.js — JustIn-Time Backend API Client
 * Connects to the live FastAPI backend at http://localhost:8000
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch (e) {
        // Response wasn't JSON
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure the FastAPI server is running with 'uvicorn main:app --reload'.`);
    }
    throw err;
  }
}

export const api = {
  // ── Events ──
  getEvents: (params) => {
    if (typeof params === 'string') {
      return request(params && params !== 'all' ? `/events?city=${encodeURIComponent(params)}` : '/events');
    }
    const query = new URLSearchParams();
    if (params?.city && params.city !== 'all') query.append('city', params.city);
    if (params?.lat !== undefined && params?.lat !== null) query.append('lat', params.lat);
    if (params?.lng !== undefined && params?.lng !== null) query.append('lng', params.lng);
    if (params?.q) query.append('q', params.q);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.radius_km) query.append('radius_km', params.radius_km);

    const queryString = query.toString();
    return request(queryString ? `/events?${queryString}` : '/events');
  },
  getEvent: (id, coords = null) => {
    if (coords?.lat && coords?.lng) {
      return request(`/events/${id}?lat=${coords.lat}&lng=${coords.lng}`);
    }
    return request(`/events/${id}`);
  },
  syncEvents: (dryRun = false) => request(`/events/sync?dry_run=${dryRun}`, {
    method: 'POST',
  }),

  // ── Venues ──
  getVenues: () => request('/venues'),
  getVenue: (id) => request(`/venues/${id}`),

  // ── Bookings ──
  getBookings: () => request('/bookings'),
  getBooking: (id) => request(`/bookings/${id}`),
  createBooking: (data) => request('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // ── Orchestration (The Engine) ──
  getOrchestration: (bookingId) => request(`/bookings/${bookingId}/orchestration`),
  recordLaneSelection: (bookingId, laneSelected, completed = true) => request(`/bookings/${bookingId}/lane-selection`, {
    method: 'POST',
    body: JSON.stringify({
      lane_selected: laneSelected,
      completed: completed,
    }),
  }),

  // ── Pilot Metrics ──
  getPilotMetrics: () => request('/pilot-metrics'),

  // ── Seed & Platform Reset ──
  resetSeed: () => request('/seed', { method: 'POST' }),

  // ── AI Chatbot ──
  sendChatMessage: (data) => request('/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // ── Agentic AI Scout (BookMyShow × Swiggy) ──
  getAgentStatus: () => request('/agent/status'),
  triggerAgentScout: (data = {}) => request('/agent/scout', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  queryAgent: (data) => request('/agent/query', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // ── Health ──
  getHealth: () => request('/health'),

  // ── Listings (Auxiliary) ──
  getRestaurants: () => request('/restaurants'),
  getSceneEvents: () => request('/scene-events'),
  getBoltVendors: () => request('/bolt-vendors'),
};

export default api;

