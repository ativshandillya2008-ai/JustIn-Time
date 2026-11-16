/**
 * src/utils/seatHelpers.js — Interactive Seat Map Utilities
 * Handles seat generation, deterministic occupancy simulation, and tier mapping.
 */

export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const SEATS_PER_ROW = 12;

export const SEAT_TIERS = {
  Gold: {
    rows: ['A', 'B', 'C'],
    name: 'Gold (Club Class)',
    price: 4999,
    accentColor: '#fbbf24',
  },
  Silver: {
    rows: ['D', 'E', 'F', 'G'],
    name: 'Silver (Executive)',
    price: 2499,
    accentColor: '#a3e635',
  },
  General: {
    rows: ['H', 'I', 'J'],
    name: 'General Access',
    price: 999,
    accentColor: '#38bdf8',
  },
};

export function getTierForRow(row) {
  if (['A', 'B', 'C'].includes(row)) return 'Gold';
  if (['D', 'E', 'F', 'G'].includes(row)) return 'Silver';
  return 'General';
}

/**
 * Deterministically generates occupied seats using an LCG pseudo-random generator
 * seeded with the eventId. This ensures the live-occupancy pattern looks natural
 * yet remains 100% stable across reloads for the same event!
 */
export function generateOccupiedSeats(eventId = 1) {
  let seed = (eventId * 9301 + 49297) % 233280;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const occupied = new Set();
  
  // Occupy about 38% of the seats
  ROWS.forEach((row) => {
    for (let num = 1; num <= SEATS_PER_ROW; num++) {
      const seatId = `${row}${num}`;
      // Center seats in Gold and Silver are more likely occupied
      const isCenter = num >= 4 && num <= 9;
      const threshold = isCenter ? 0.45 : 0.28;
      if (rnd() < threshold) {
        occupied.add(seatId);
      }
    }
  });

  return occupied;
}

export function formatINR(val) {
  if (val === null || val === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}
