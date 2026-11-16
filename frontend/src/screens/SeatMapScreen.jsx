/**
 * src/screens/SeatMapScreen.jsx — BookMyShow Authentic Seat Layout & F&B Experience
 * 
 * Features:
 *   1. "How many seats?" Pop-up Modal (matching BMS screenshot 3):
 *      - Dynamic vehicle illustration (scooter, bike, auto, car, bus)
 *      - Number picker 1 to 10 in circular badges
 *      - Tiers overview (Recliner, Extra Legroom, Picture Perfect)
 *      - Bestseller Seats highlight
 *   2. Cinema Seat Layout (matching BMS screenshot 1 & 4):
 *      - Header with movie name, venue, date/time, accessibility icon, and "{count} Tickets" edit button
 *      - Horizontal showtime chips row at top (e.g. 09:50 AM PxL in green)
 *      - Tiered seat map: ₹660 Recliner, ₹330 Prime / ₹400 Picture Perfect, ₹400 Extra Legroom, ₹300 Classic Plus
 *      - Exact BMS color-coded seat states (Available, Sold, Bestseller, Selected)
 *      - Floating zoom controls (+ and -) with zoom tooltip
 *      - Bottom bar with Bank Offer carousel and "Pay ₹ {total}" button
 *   3. "Grab a Bite!" Food & Beverages Screen (matching BMS screenshot 2):
 *      - Top header with movie info and top-right "Skip" button
 *      - F&B catalog: search, category tabs (All, Popcorn, Beverages, Snacks, Combos), 2-col food cards with Veg dot, kcal/allergen info
 *      - Right cart sidebar: Ticket(s) price, empty cart illustration, itemized bill, and "Proceed to Pay" button
 *   4. Direct integration with JustIn-Time Orchestration engine
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Ticket, Check, X, Search, Plus, Minus,
  ZoomIn, ZoomOut, Info, ShieldCheck, Heart, AlertCircle,
  RefreshCw, Compass, Edit3, ArrowRight
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCity } from '../contexts/CityContext';
import { formatINR } from '../utils/seatHelpers';

/* ─── Vehicle SVG Illustrations for "How many seats?" Modal ───────── */
function VehicleIllustration({ count }) {
  if (count === 1) {
    // 🛵 Scooter
    return (
      <svg width="120" height="75" viewBox="0 0 120 75" fill="none" style={{ margin: '0 auto' }}>
        <circle cx="30" cy="55" r="14" fill="#334155" stroke="#0f172a" strokeWidth="4"/>
        <circle cx="30" cy="55" r="6" fill="#94a3b8"/>
        <circle cx="90" cy="55" r="14" fill="#334155" stroke="#0f172a" strokeWidth="4"/>
        <circle cx="90" cy="55" r="6" fill="#94a3b8"/>
        <path d="M30 55 L45 35 L75 35 L90 55" stroke="#f84464" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="42" y="26" width="34" height="10" rx="4" fill="#1e293b"/>
        <path d="M75 35 L82 15 L74 15" stroke="#64748b" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="84" cy="18" r="4" fill="#facc15"/>
      </svg>
    );
  }
  if (count === 2) {
    // 🏍️ Motorcycle
    return (
      <svg width="120" height="75" viewBox="0 0 120 75" fill="none" style={{ margin: '0 auto' }}>
        <circle cx="28" cy="54" r="14" fill="#334155" stroke="#0f172a" strokeWidth="4"/>
        <circle cx="28" cy="54" r="6" fill="#94a3b8"/>
        <circle cx="92" cy="54" r="14" fill="#334155" stroke="#0f172a" strokeWidth="4"/>
        <circle cx="92" cy="54" r="6" fill="#94a3b8"/>
        <path d="M28 54 L50 36 L70 36 L92 54" stroke="#e11d48" strokeWidth="6" strokeLinecap="round"/>
        <path d="M46 32 Q60 22 75 32 Z" fill="#f84464"/>
        <path d="M72 32 L84 18 L76 18" stroke="#475569" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="86" cy="20" r="4" fill="#fef08a"/>
      </svg>
    );
  }
  if (count === 3) {
    // 🛺 Auto Rickshaw
    return (
      <svg width="120" height="75" viewBox="0 0 120 75" fill="none" style={{ margin: '0 auto' }}>
        <circle cx="32" cy="56" r="12" fill="#334155" stroke="#0f172a" strokeWidth="3"/>
        <circle cx="88" cy="56" r="12" fill="#334155" stroke="#0f172a" strokeWidth="3"/>
        <path d="M25 50 Q28 20 50 18 L85 18 Q95 24 95 50 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2"/>
        <path d="M25 50 L95 50 L95 40 L25 40 Z" fill="#166534"/>
        <rect x="36" y="24" width="22" height="14" rx="2" fill="#bae6fd" opacity="0.9"/>
        <rect x="64" y="24" width="24" height="14" rx="2" fill="#bae6fd" opacity="0.9"/>
      </svg>
    );
  }
  if (count >= 4 && count <= 7) {
    // 🚗 Sedan / SUV Car
    return (
      <svg width="130" height="75" viewBox="0 0 130 75" fill="none" style={{ margin: '0 auto' }}>
        <circle cx="34" cy="56" r="12" fill="#334155" stroke="#0f172a" strokeWidth="3"/>
        <circle cx="96" cy="56" r="12" fill="#334155" stroke="#0f172a" strokeWidth="3"/>
        <path d="M14 50 L24 38 L45 22 L85 22 L106 38 L116 50 Z" fill="#f84464"/>
        <rect x="44" y="25" width="20" height="12" rx="2" fill="#bae6fd"/>
        <rect x="68" y="25" width="22" height="12" rx="2" fill="#bae6fd"/>
        <circle cx="114" cy="44" r="3" fill="#fef08a"/>
      </svg>
    );
  }
  // 🚌 Luxury Bus (matching BookMyShow screenshot 3: turquoise and coral red bus)
  return (
    <svg width="140" height="75" viewBox="0 0 140 75" fill="none" style={{ margin: '0 auto' }}>
      <rect x="15" y="16" width="110" height="40" rx="8" fill="#f84464"/>
      <rect x="15" y="16" width="110" height="18" rx="6" fill="#06b6d4"/>
      {/* Bus Windows */}
      <rect x="22" y="20" width="14" height="11" rx="2" fill="#e0f2fe"/>
      <rect x="40" y="20" width="14" height="11" rx="2" fill="#e0f2fe"/>
      <rect x="58" y="20" width="14" height="11" rx="2" fill="#e0f2fe"/>
      <rect x="76" y="20" width="14" height="11" rx="2" fill="#e0f2fe"/>
      <rect x="94" y="20" width="14" height="11" rx="2" fill="#e0f2fe"/>
      <rect x="112" y="20" width="8" height="16" rx="2" fill="#bae6fd"/>
      {/* Headlights & Details */}
      <circle cx="122" cy="46" r="3" fill="#fef08a"/>
      <rect x="16" y="44" width="8" height="3" fill="#dc2626"/>
      {/* Wheels */}
      <circle cx="38" cy="56" r="11" fill="#334155" stroke="#0f172a" strokeWidth="3"/>
      <circle cx="38" cy="56" r="4" fill="#94a3b8"/>
      <circle cx="102" cy="56" r="11" fill="#334155" stroke="#0f172a" strokeWidth="3"/>
      <circle cx="102" cy="56" r="4" fill="#94a3b8"/>
    </svg>
  );
}

/* ─── Showtime Timeslots ─────────────────────────────────────────── */
const SHOWTIMES_LIST = [
  { time: '09:20 AM', format: 'LUXE' },
  { time: '09:50 AM', format: 'PxL' },
  { time: '12:30 PM', format: 'LUXE' },
  { time: '01:00 PM', format: 'PxL' },
  { time: '03:40 PM', format: 'LUXE' },
  { time: '04:10 PM', format: 'PxL' },
  { time: '06:50 PM', format: 'LUXE' },
  { time: '07:20 PM', format: 'PxL' },
  { time: '10:00 PM', format: 'LUXE' },
  { time: '10:30 PM', format: 'PxL' },
];

/* ─── Cinema Seat Layout Matrix (BookMyShow Exact Hierarchy) ─────── */
const SEAT_TIER_CONFIG = {
  RECLINER: {
    price: 660,
    title: '₹660 RECLINER ROWS',
    rows: ['Q'],
    cols: 22,
    isRecliner: true,
  },
  PRIME_AND_PICTURE_PERFECT: {
    pricePrime: 330,
    pricePicPerfect: 400,
    rows: ['P', 'N', 'M', 'L', 'K'],
    leftCols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    centerCols: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    rightCols: [25, 26, 27, 28, 29, 30, 31],
  },
  EXTRA_LEGROOM: {
    price: 400,
    title: '₹400 EXTRA LEGROOM ROWS',
    rows: ['J'],
    leftCols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    centerCols: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    rightCols: [25, 26, 27],
  },
  CLASSIC_PLUS: {
    price: 300,
    title: '₹300 CLASSIC PLUS ROWS',
    rows: ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'],
    leftCols: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    centerCols: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    rightCols: [25, 26, 27, 28, 29],
  },
};

/* ─── Real BookMyShow F&B Items (matching Screenshot 2) ─────────── */
const BMS_FNB_ITEMS = [
  {
    id: 'fnb-1',
    name: 'Regular Salted Popcorn 80g',
    category: 'Popcorn',
    desc: 'Regular Salted Popcorn 80g (273 Kcal | Allergens: Milk)',
    price: 295,
    veg: true,
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=300&h=240&fit=crop',
  },
  {
    id: 'fnb-2',
    name: 'Regular Pepsi 540ml',
    category: 'Beverages',
    desc: 'Regular Pepsi 540ml (232 Kcal | Allergens: Caffeine)',
    price: 270,
    veg: true,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=240&fit=crop',
  },
  {
    id: 'fnb-3',
    name: 'Regular Cheese Popcorn 80g',
    category: 'Popcorn',
    desc: 'Regular Cheese Popcorn 80g (257 Kcal | Allergens: Milk)',
    price: 345,
    veg: true,
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=300&h=240&fit=crop',
  },
  {
    id: 'fnb-4',
    name: 'Veg Cheesy Nachos 110g',
    category: 'Snacks',
    desc: 'Veg Cheesy Nachos 110g (398 Kcal | Allergens: Milk, Gluten)',
    price: 345,
    veg: true,
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300&h=240&fit=crop',
  },
  {
    id: 'fnb-5',
    name: 'Paneer Tikka Sandwich 190g',
    category: 'Snacks',
    desc: 'Paneer Tikka Sandwich 190g (529 Kcal | Allergens: Milk, Wheat, Soybean)',
    price: 270,
    veg: true,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=240&fit=crop',
  },
  {
    id: 'fnb-6',
    name: 'Medium Cheese Popcorn 170g',
    category: 'Popcorn',
    desc: 'Medium Cheese Popcorn 170g (546 Kcal | Allergens: Milk)',
    price: 495,
    veg: true,
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=300&h=240&fit=crop',
  },
  {
    id: 'fnb-7',
    name: 'Regular Caramel Popcorn 80g',
    category: 'Popcorn',
    desc: 'Regular Caramel Popcorn 80g (413 Kcal | Allergens: Soybean)',
    price: 345,
    veg: true,
    image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=300&h=240&fit=crop',
  },
  {
    id: 'fnb-8',
    name: 'Combo 1 (Caramel Popcorn + Pepsi)',
    category: 'Combos',
    desc: 'Caramel Popcorn 80g + Pepsi 450ml (595 Kcal | Allergens: Soybean, Caffeine)',
    price: 480,
    veg: true,
    image: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=300&h=240&fit=crop',
  },
];

/**
 * Deterministically generates occupied seats based on event ID AND the specific showtime.
 * Every showtime gets a distinct seed and realistic time-of-day occupancy rate.
 */
function getShowtimeOccupiedSeats(eventId, showtimeStr) {
  const occupied = new Set();
  const eid = parseInt(eventId) || 1;
  const time = showtimeStr || '09:50 AM';

  // Compute a strong hash combining eventId and showtime string
  let timeHash = 5381;
  for (let i = 0; i < time.length; i++) {
    timeHash = ((timeHash << 5) + timeHash) + time.charCodeAt(i);
    timeHash |= 0;
  }

  // Combined pseudo-random seed
  let seed = Math.abs((eid * 2654435761) ^ (timeHash * 1597334677)) % 2147483647;
  if (seed === 0) seed = 12345;

  // LCG random generator
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Base occupancy by time of day:
  // Evening shows have much higher occupancy ("FAST FILLING") than morning shows
  let baseRate = 0.32;
  if (time.includes('06:') || time.includes('07:')) {
    baseRate = 0.62; // Peak evening (62% booked)
  } else if (time.includes('12:') || time.includes('01:')) {
    baseRate = 0.46; // Matinee (46% booked)
  } else if (time.includes('03:') || time.includes('04:')) {
    baseRate = 0.38; // Mid-afternoon (38% booked)
  } else if (time.includes('10:')) {
    baseRate = 0.42; // Night show (42% booked)
  } else {
    baseRate = 0.25; // Morning show (25% booked)
  }

  const allRows = ['Q', 'P', 'N', 'M', 'L', 'K', 'J', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

  allRows.forEach((row, rowIdx) => {
    const maxCol = row === 'Q' ? 22 : row === 'J' ? 27 : 31;
    // Row weighting: Recliner & Prime rows fill faster than front rows (A, B, C)
    const rowMultiplier = rowIdx <= 4 ? 1.3 : rowIdx <= 8 ? 1.05 : 0.7;

    for (let c = 1; c <= maxCol; c++) {
      // Center seats fill faster than extreme sides
      const isCenter = (row === 'Q' && c >= 7 && c <= 16) || (c >= 12 && c <= 22);
      const isAisle = (c === 1 || c === 9 || c === 10 || c === 24 || c === 25 || c === maxCol);
      const posMultiplier = isCenter ? 1.35 : isAisle ? 1.1 : 0.75;

      const prob = Math.min(0.88, Math.max(0.08, baseRate * rowMultiplier * posMultiplier));
      if (rnd() < prob) {
        occupied.add(`${row}-${c}`);
      }
    }
  });

  return occupied;
}

/**
 * Finds contiguous available seats for `targetCount` in Picture Perfect / Prime rows
 */
function findAvailableContiguousSeats(occupiedSet, targetCount) {
  const candidateRows = ['M', 'L', 'N', 'P', 'K', 'J', 'H', 'G', 'F', 'E'];
  for (const r of candidateRows) {
    const maxCol = r === 'Q' ? 22 : r === 'J' ? 27 : 31;
    const tier = (r === 'Q') ? 'Recliner' : (r === 'J') ? 'Extra Legroom' : ['H','G','F','E','D','C','B','A'].includes(r) ? 'Classic Plus' : 'Picture Perfect';
    const price = (r === 'Q') ? 660 : (r === 'J') ? 400 : ['H','G','F','E','D','C','B','A'].includes(r) ? 300 : 400;

    // Search in center columns first
    for (let startCol = 10; startCol <= maxCol - targetCount + 1; startCol++) {
      let allAvail = true;
      const cluster = [];
      for (let c = startCol; c < startCol + targetCount; c++) {
        if (occupiedSet.has(`${r}-${c}`)) {
          allAvail = false;
          break;
        }
        cluster.push({ id: `${r}-${c}`, row: r, num: c, tier, price });
      }
      if (allAvail && cluster.length === targetCount) {
        return cluster;
      }
    }

    // Search anywhere in row
    for (let startCol = 1; startCol <= maxCol - targetCount + 1; startCol++) {
      let allAvail = true;
      const cluster = [];
      for (let c = startCol; c < startCol + targetCount; c++) {
        if (occupiedSet.has(`${r}-${c}`)) {
          allAvail = false;
          break;
        }
        cluster.push({ id: `${r}-${c}`, row: r, num: c, tier, price });
      }
      if (allAvail && cluster.length === targetCount) {
        return cluster;
      }
    }
  }
  return [];
}

export default function SeatMapScreen() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCity } = useCity();

  // URL Query Parameters
  const initialFormat = searchParams.get('format') || '2D';
  const initialLang = searchParams.get('lang') || 'Hindi';
  const initialTime = searchParams.get('time') || '09:50 AM';

  // Data state
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Flow Views: 'seats' | 'fnb'
  const [view, setView] = useState('seats');

  // BookMyShow Seat Picker States
  const [seatModalOpen, setSeatModalOpen] = useState(true);
  const [seatCount, setSeatCount] = useState(2);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);
  const [selectedLang, setSelectedLang] = useState(initialLang);

  // Selected Seats map: key = `${row}${num}`, value = { id, row, num, price, tier }
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoomTooltip, setShowZoomTooltip] = useState(true);

  // Food & Beverage States
  const [fnbCart, setFnbCart] = useState({});
  const [fnbCategory, setFnbCategory] = useState('All');
  const [fnbSearch, setFnbSearch] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Deterministically occupied seats based on event ID AND the selected showtime!
  const occupiedSeats = useMemo(() => {
    return getShowtimeOccupiedSeats(eventId, selectedTime);
  }, [eventId, selectedTime]);

  // Load Event and Venue Details
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const ev = await api.getEvent(eventId);
        setEvent(ev);
        if (ev.venue_id) {
          try {
            const vn = await api.getVenue(ev.venue_id);
            setVenue(vn);
          } catch (e) {
            // fallback venue
            setVenue({ name: 'PVR: Superplex Forum Mall, Kanakapura Road', city: selectedCity });
          }
        } else {
          setVenue({ name: 'PVR: Superplex Forum Mall, Kanakapura Road', city: selectedCity });
        }
      } catch (err) {
        console.error('Failed to load event:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId, selectedCity]);

  // Dismiss zoom tooltip after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowZoomTooltip(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Format date helper
  const dateFormatted = useMemo(() => {
    if (event?.date) {
      try {
        const d = new Date(event.date);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      } catch (e) {}
    }
    return 'Fri, 02 October, 2026';
  }, [event]);

  // Calculate ticket total
  const ticketTotal = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + s.price, 0);
  }, [selectedSeats]);

  // Calculate F&B total
  const fnbTotal = useMemo(() => {
    return Object.values(fnbCart).reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [fnbCart]);

  // Grand total
  const grandTotal = ticketTotal + fnbTotal;

  // Smart Seat Selection Logic (BMS-style contiguous selection)
  const handleSeatClick = (row, num, tierName, price) => {
    const seatId = `${row}-${num}`;
    if (occupiedSeats.has(seatId)) return;

    const isAlreadySelected = selectedSeats.some(s => s.id === seatId);

    if (isAlreadySelected) {
      // Toggle off
      setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
      return;
    }

    // Try contiguous seat selection for `seatCount` tickets
    const maxCol = row === 'Q' ? 22 : row === 'J' ? 27 : 31;
    const candidates = [];

    // Check rightward
    for (let c = num; c <= maxCol && candidates.length < seatCount; c++) {
      const cid = `${row}-${c}`;
      if (!occupiedSeats.has(cid)) {
        candidates.push({ id: cid, row, num: c, tier: tierName, price });
      } else {
        break;
      }
    }

    // If not enough rightward, check leftward
    if (candidates.length < seatCount) {
      for (let c = num - 1; c >= 1 && candidates.length < seatCount; c--) {
        const cid = `${row}-${c}`;
        if (!occupiedSeats.has(cid)) {
          candidates.unshift({ id: cid, row, num: c, tier: tierName, price });
        } else {
          break;
        }
      }
    }

    if (candidates.length > 0) {
      setSelectedSeats(candidates);
    }
  };

  // Handle switching showtimes — instantly recomputes booked seats and adapts selection
  const handleShowtimeChange = (newTime, newFormat) => {
    setSelectedTime(newTime);
    if (newFormat) setSelectedFormat(newFormat);

    // Compute the new showtime's occupied seats immediately
    const nextOccupied = getShowtimeOccupiedSeats(eventId, newTime);
    // Find new available contiguous seats for the chosen seatCount in this new showtime
    const newPreselected = findAvailableContiguousSeats(nextOccupied, seatCount);
    setSelectedSeats(newPreselected);
  };

  // Add / remove F&B items
  const updateFnbQty = (item, delta) => {
    setFnbCart(prev => {
      const current = prev[item.id]?.qty || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: { ...item, qty: next },
      };
    });
  };

  // Finalize booking and route to Orchestration
  const handleProceedToOrchestration = async () => {
    setBookingInProgress(true);
    setError(null);

    try {
      const payload = {
        user_id: user?.id || 'guest_user',
        event_id: parseInt(eventId),
        seat_section: selectedSeats[0]?.tier || 'Prime',
        price_tier: 'premium',
        quantity: selectedSeats.length || seatCount,
        booking_amount: grandTotal || 660,
      };

      const booking = await api.createBooking(payload);
      console.log('[JustIn-Time] Created Booking & Triggered Orchestration:', booking);

      // Package food items for orchestration
      const foodItems = Object.values(fnbCart).map(f => ({
        id: f.id,
        name: f.name,
        price: f.price,
        qty: f.qty,
      }));

      navigate(`/orchestration/${booking.id}`, {
        state: {
          booking,
          event,
          venue,
          selectedSeats,
          foodItems,
          totalPrice: grandTotal,
          showtime: selectedTime,
          format: selectedFormat,
        },
      });
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError(err.message);
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={36} style={{ animation: 'spin 1.2s linear infinite', marginBottom: 14, opacity: 0.4 }} />
        <div style={{ fontWeight: 600, fontSize: '1rem' }}>Loading BookMyShow Seat Layout…</div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     VIEW 2: "GRAB A BITE!" (FOOD AND BEVERAGES SCREEN - SCREENSHOT 2)
  ═══════════════════════════════════════════════════════════════════════ */
  if (view === 'fnb') {
    const fnbCategories = ['All', 'Popcorn', 'Beverages', 'Snacks', 'Combos'];
    const filteredFnb = BMS_FNB_ITEMS.filter(f => {
      if (fnbCategory !== 'All' && f.category !== fnbCategory) return false;
      if (fnbSearch && !f.name.toLowerCase().includes(fnbSearch.toLowerCase())) return false;
      return true;
    });

    const cartItems = Object.values(fnbCart);

    return (
      <div style={{ background: '#f5f5f7', minHeight: '100vh', margin: '-24px -20px', padding: '0 0 60px', color: '#1c1c1c' }}>
        {/* Top Header */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setView('seats')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1c1c1c' }}
              title="Back to Seat Layout"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>
                {event?.name} - {selectedLang}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                {venue?.name || 'PVR: Superplex Forum Mall'} | {dateFormatted} | {selectedTime}
              </div>
            </div>
          </div>

          {/* Top Right "Skip" button */}
          <button
            id="fnb-skip-btn"
            onClick={handleProceedToOrchestration}
            disabled={bookingInProgress}
            style={{
              padding: '8px 24px',
              borderRadius: 6,
              background: '#f84464',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {bookingInProgress ? 'Processing…' : 'Skip'}
          </button>
        </div>

        {/* Main 2-Column Content */}
        <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>
          {/* Left Column: F&B Menu Catalog */}
          <div style={{ background: '#ffffff', borderRadius: 12, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' }}>
            {/* Grab a Bite Title + Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Grab a Bite!</h2>
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search for F&B Items"
                  value={fnbSearch}
                  onChange={e => setFnbSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: '0.82rem',
                    outline: 'none',
                    color: '#1f2937',
                  }}
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid #e5e7eb', marginBottom: 24, paddingBottom: 8 }}>
              {fnbCategories.map(cat => {
                const active = fnbCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFnbCategory(cat)}
                    style={{
                      background: 'none',
                      border: 'none',
                      paddingBottom: 6,
                      borderBottom: active ? '2px solid #f84464' : '2px solid transparent',
                      color: active ? '#f84464' : '#6b7280',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* 2-Column Food Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
              {filteredFnb.map(item => {
                const cartQty = fnbCart[item.id]?.qty || 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    <div>
                      {/* Veg Indicator + Image */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ width: 14, height: 14, border: '1.5px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                        </div>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: 90, height: 80, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                        />
                      </div>

                      {/* Item Title */}
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', marginBottom: 4, lineHeight: 1.3 }}>
                        {item.name}
                      </div>

                      {/* Item Description & Allergens */}
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.4, marginBottom: 12 }}>
                        {item.desc}
                      </div>
                    </div>

                    {/* Price & Add Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>
                        ₹{item.price}
                      </span>

                      {cartQty > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #f84464', borderRadius: 6, overflow: 'hidden' }}>
                          <button
                            onClick={() => updateFnbQty(item, -1)}
                            style={{ background: '#ffffff', border: 'none', padding: '4px 10px', color: '#f84464', cursor: 'pointer', fontWeight: 800 }}
                          >
                            -
                          </button>
                          <span style={{ padding: '0 8px', fontSize: '0.85rem', fontWeight: 800, color: '#f84464' }}>
                            {cartQty}
                          </span>
                          <button
                            onClick={() => updateFnbQty(item, 1)}
                            style={{ background: '#ffffff', border: 'none', padding: '4px 10px', color: '#f84464', cursor: 'pointer', fontWeight: 800 }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateFnbQty(item, 1)}
                          style={{
                            padding: '6px 20px',
                            borderRadius: 6,
                            border: '1px solid #f84464',
                            background: '#ffffff',
                            color: '#f84464',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = '#f84464'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#f84464'; }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: "Your Cart" Sidebar */}
          <div style={{ background: '#ffffff', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' }}>
            {/* Ticket Price Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
              <span style={{ fontSize: '0.88rem', color: '#4b5563', fontWeight: 600 }}>Ticket(s) price</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                ₹{ticketTotal.toFixed(2)}
              </span>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', marginBottom: 14 }}>
              Your Cart
            </h3>

            {cartItems.length === 0 ? (
              // Empty Cart State with Popcorn Illustration
              <div style={{ textAlign: 'center', padding: '36px 12px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🍿</div>
                <div style={{ fontSize: '0.84rem', color: '#6b7280', fontWeight: 500, lineHeight: 1.4 }}>
                  Fill this cart with your favorite food combos!
                </div>
              </div>
            ) : (
              // Items in Cart
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {cartItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                    <div style={{ maxWidth: 180 }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Qty: {item.qty} × ₹{item.price}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#111827' }}>
                      ₹{item.price * item.qty}
                    </span>
                  </div>
                ))}

                <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4b5563' }}>
                  <span>Food Subtotal</span>
                  <span style={{ fontWeight: 700 }}>₹{fnbTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4b5563' }}>
                  <span>Convenience & Tax</span>
                  <span style={{ fontWeight: 700 }}>₹{(fnbTotal * 0.05).toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Total & Checkout Action */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Grand Total</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f84464' }}>
                  ₹{(grandTotal + fnbTotal * 0.05).toFixed(0)}
                </span>
              </div>

              <button
                id="fnb-proceed-btn"
                onClick={handleProceedToOrchestration}
                disabled={bookingInProgress}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 8,
                  background: '#f84464',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(248,68,100,0.35)',
                  transition: 'all 0.18s ease',
                }}
              >
                {bookingInProgress ? 'Confirming with Swiggy Dispatch…' : `Pay ₹${(grandTotal + fnbTotal * 0.05).toFixed(0)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     VIEW 1: BOOKMYSHOW SEAT LAYOUT & MODAL (SCREENSHOT 1, 3, 4)
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', margin: '-24px -20px', color: '#1c1c1c', position: 'relative' }}>
      {/* ── 1. Top Header ── */}
      <div style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/events" style={{ display: 'flex', alignItems: 'center', color: '#1c1c1c', textDecoration: 'none' }}>
            <ChevronLeft size={24} />
          </Link>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>
              {event?.name} - {selectedLang}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#6b7280', marginTop: 2 }}>
              {venue?.name || 'PVR: Superplex Forum Mall, Kanakapura Road'} | {dateFormatted} | {selectedTime}
            </div>
          </div>
        </div>

        {/* Accessibility + Tickets Count Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            title="Accessibility Info"
            style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #d1d5db', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563' }}
          >
            ♿
          </button>

          {/* Edit seat count button */}
          <button
            id="edit-seat-count-btn"
            onClick={() => setSeatModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #f84464',
              background: '#ffffff',
              color: '#f84464',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <Edit3 size={13} />
            <span>{seatCount} Tickets</span>
          </button>
        </div>
      </div>

      {/* ── 2. Showtime Chips Bar ── */}
      <div style={{ padding: '10px 28px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', gap: 10, overflowX: 'auto' }}>
        {SHOWTIMES_LIST.map((slot, idx) => {
          const isSelected = selectedTime === slot.time;
          return (
            <button
              key={idx}
              id={`showtime-chip-${idx}`}
              onClick={() => handleShowtimeChange(slot.time, slot.format)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: 4,
                border: isSelected ? '1.5px solid #22c55e' : '1px solid #22c55e',
                background: isSelected ? '#22c55e' : '#ffffff',
                color: isSelected ? '#ffffff' : '#15803d',
                cursor: 'pointer',
                flexShrink: 0,
                minWidth: 84,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{slot.time}</span>
              <span style={{ fontSize: '0.62rem', color: isSelected ? '#ffffff' : '#6b7280', marginTop: 1 }}>{slot.format}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Seat Map Canvas Container ── */}
      <div style={{ overflowX: 'auto', padding: '36px 20px 140px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease', maxWidth: 940, width: '100%' }}>

          {/* SECTION 1: RECLINER ROWS */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#374151', textAlign: 'center', marginBottom: 14, letterSpacing: '0.04em' }}>
              {SEAT_TIER_CONFIG.RECLINER.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ width: 20, fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textAlign: 'center' }}>Q</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {Array.from({ length: SEAT_TIER_CONFIG.RECLINER.cols }, (_, i) => i + 1).map(num => {
                  const seatId = `Q-${num}`;
                  const isSold = occupiedSeats.has(seatId);
                  const isSel = selectedSeats.some(s => s.id === seatId);

                  return (
                    <button
                      key={seatId}
                      disabled={isSold}
                      onClick={() => handleSeatClick('Q', num, 'Recliner', 660)}
                      className={`bms-seat-box recliner ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                      style={{ margin: num === 4 || num === 18 ? '0 12px 0 0' : '0' }}
                    >
                      {num < 10 ? `0${num}` : num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: '#f3f4f6', margin: '24px 0' }} />

          {/* SECTION 2: PRIME ROWS & PICTURE PERFECT */}
          <div style={{ marginBottom: 32 }}>
            {/* Headers row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#374151', marginBottom: 14, padding: '0 40px' }}>
              <span>₹330 PRIME ROWS</span>
              <span style={{ color: '#059669' }}>₹400 PICTURE PERFECT</span>
              <span>₹330 PRIME ROWS</span>
            </div>

            {/* Rows P, N, M, L, K */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SEAT_TIER_CONFIG.PRIME_AND_PICTURE_PERFECT.rows.map(row => (
                <div key={row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <span style={{ width: 20, fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textAlign: 'center' }}>{row}</span>

                  {/* Left Block (01-09) */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {SEAT_TIER_CONFIG.PRIME_AND_PICTURE_PERFECT.leftCols.map(num => {
                      const seatId = `${row}-${num}`;
                      const isSold = occupiedSeats.has(seatId);
                      const isSel = selectedSeats.some(s => s.id === seatId);
                      return (
                        <button
                          key={seatId}
                          disabled={isSold}
                          onClick={() => handleSeatClick(row, num, 'Prime', 330)}
                          className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                        >
                          {num < 10 ? `0${num}` : num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Aisle */}
                  <div style={{ width: 14 }} />

                  {/* Center Block: Picture Perfect (10-24) */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {SEAT_TIER_CONFIG.PRIME_AND_PICTURE_PERFECT.centerCols.map(num => {
                      const seatId = `${row}-${num}`;
                      const isSold = occupiedSeats.has(seatId);
                      const isSel = selectedSeats.some(s => s.id === seatId);
                      const isBestseller = (num >= 14 && num <= 20);
                      return (
                        <button
                          key={seatId}
                          disabled={isSold}
                          onClick={() => handleSeatClick(row, num, 'Picture Perfect', 400)}
                          className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : isBestseller ? 'bestseller' : 'available'}`}
                        >
                          {num < 10 ? `0${num}` : num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Aisle */}
                  <div style={{ width: 14 }} />

                  {/* Right Block (25-31) */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {SEAT_TIER_CONFIG.PRIME_AND_PICTURE_PERFECT.rightCols.map(num => {
                      const seatId = `${row}-${num}`;
                      const isSold = occupiedSeats.has(seatId);
                      const isSel = selectedSeats.some(s => s.id === seatId);
                      return (
                        <button
                          key={seatId}
                          disabled={isSold}
                          onClick={() => handleSeatClick(row, num, 'Prime', 330)}
                          className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: '#f3f4f6', margin: '24px 0' }} />

          {/* SECTION 3: EXTRA LEGROOM ROWS (Row J) */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#374151', textAlign: 'center', marginBottom: 14 }}>
              {SEAT_TIER_CONFIG.EXTRA_LEGROOM.title}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ width: 20, fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textAlign: 'center' }}>J</span>

              {/* Left Block */}
              <div style={{ display: 'flex', gap: 4 }}>
                {SEAT_TIER_CONFIG.EXTRA_LEGROOM.leftCols.map(num => {
                  const seatId = `J-${num}`;
                  const isSold = occupiedSeats.has(seatId);
                  const isSel = selectedSeats.some(s => s.id === seatId);
                  return (
                    <button
                      key={seatId}
                      disabled={isSold}
                      onClick={() => handleSeatClick('J', num, 'Extra Legroom', 400)}
                      className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                    >
                      {num < 10 ? `0${num}` : num}
                    </button>
                  );
                })}
              </div>

              <div style={{ width: 14 }} />

              {/* Center Block */}
              <div style={{ display: 'flex', gap: 4 }}>
                {SEAT_TIER_CONFIG.EXTRA_LEGROOM.centerCols.map(num => {
                  const seatId = `J-${num}`;
                  const isSold = occupiedSeats.has(seatId);
                  const isSel = selectedSeats.some(s => s.id === seatId);
                  return (
                    <button
                      key={seatId}
                      disabled={isSold}
                      onClick={() => handleSeatClick('J', num, 'Extra Legroom', 400)}
                      className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                    >
                      {num < 10 ? `0${num}` : num}
                    </button>
                  );
                })}
              </div>

              <div style={{ width: 14 }} />

              {/* Right Block */}
              <div style={{ display: 'flex', gap: 4 }}>
                {SEAT_TIER_CONFIG.EXTRA_LEGROOM.rightCols.map(num => {
                  const seatId = `J-${num}`;
                  const isSold = occupiedSeats.has(seatId);
                  const isSel = selectedSeats.some(s => s.id === seatId);
                  return (
                    <button
                      key={seatId}
                      disabled={isSold}
                      onClick={() => handleSeatClick('J', num, 'Extra Legroom', 400)}
                      className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: '#f3f4f6', margin: '24px 0' }} />

          {/* SECTION 4: CLASSIC PLUS ROWS */}
          <div style={{ marginBottom: 44 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#374151', textAlign: 'center', marginBottom: 14 }}>
              {SEAT_TIER_CONFIG.CLASSIC_PLUS.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SEAT_TIER_CONFIG.CLASSIC_PLUS.rows.map(row => (
                <div key={row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <span style={{ width: 20, fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textAlign: 'center' }}>{row}</span>

                  <div style={{ display: 'flex', gap: 4 }}>
                    {SEAT_TIER_CONFIG.CLASSIC_PLUS.leftCols.map(num => {
                      const seatId = `${row}-${num}`;
                      const isSold = occupiedSeats.has(seatId);
                      const isSel = selectedSeats.some(s => s.id === seatId);
                      return (
                        <button
                          key={seatId}
                          disabled={isSold}
                          onClick={() => handleSeatClick(row, num, 'Classic Plus', 300)}
                          className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                        >
                          {num < 10 ? `0${num}` : num}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ width: 14 }} />

                  <div style={{ display: 'flex', gap: 4 }}>
                    {SEAT_TIER_CONFIG.CLASSIC_PLUS.centerCols.map(num => {
                      const seatId = `${row}-${num}`;
                      const isSold = occupiedSeats.has(seatId);
                      const isSel = selectedSeats.some(s => s.id === seatId);
                      return (
                        <button
                          key={seatId}
                          disabled={isSold}
                          onClick={() => handleSeatClick(row, num, 'Classic Plus', 300)}
                          className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                        >
                          {num < 10 ? `0${num}` : num}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ width: 14 }} />

                  <div style={{ display: 'flex', gap: 4 }}>
                    {SEAT_TIER_CONFIG.CLASSIC_PLUS.rightCols.map(num => {
                      const seatId = `${row}-${num}`;
                      const isSold = occupiedSeats.has(seatId);
                      const isSel = selectedSeats.some(s => s.id === seatId);
                      return (
                        <button
                          key={seatId}
                          disabled={isSold}
                          onClick={() => handleSeatClick(row, num, 'Classic Plus', 300)}
                          className={`bms-seat-box ${isSel ? 'selected' : isSold ? 'sold' : 'available'}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Screen Curve Indicator */}
          <div style={{ textAlign: 'center', marginTop: 36, marginBottom: 24 }}>
            <div style={{ height: 4, width: '70%', margin: '0 auto', background: 'linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%)', borderRadius: 4 }} />
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10, fontWeight: 700 }}>
              All eyes this way please! ── SCREEN ──
            </div>
          </div>

          {/* BMS Color Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, fontSize: '0.75rem', color: '#4b5563', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, border: '1.5px solid #22c55e', background: '#fff' }} />
              <span>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, background: '#e2e8f0' }} />
              <span>Sold</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, border: '1.5px solid #eab308', background: '#fff' }} />
              <span>Bestseller <Info size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, background: '#22c55e' }} />
              <span style={{ fontWeight: 700, color: '#15803d' }}>Selected</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Floating Zoom Controls on Right ── */}
      <div style={{ position: 'fixed', right: 28, bottom: 120, zIndex: 40, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        {showZoomTooltip && (
          <div style={{ background: '#2563eb', color: '#ffffff', fontSize: '0.72rem', fontWeight: 600, padding: '6px 12px', borderRadius: 6, boxShadow: '0 4px 12px rgba(37,99,235,0.3)', whiteSpace: 'nowrap', marginBottom: 4 }}>
            The layout can be zoomed in/out
          </div>
        )}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <button
            onClick={() => setZoomLevel(z => Math.min(z + 0.1, 1.3))}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#fff', cursor: 'pointer', borderBottom: '1px solid #e5e7eb', color: '#374151' }}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.75))}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#fff', cursor: 'pointer', color: '#374151' }}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      {/* ── 5. Bottom Sticky Bar (Offer + Coral Pay Button) ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45, background: '#ffffff', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)', padding: '12px 28px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Bank Offer Carousel Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#374151' }}>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>✓</span>
            <span style={{ fontWeight: 600 }}>YES Private Debit Card Offer</span>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginLeft: 6 }}>1/3</span>
          </div>

          {/* Pay Button */}
          <button
            id="seat-pay-btn"
            onClick={() => {
              if (selectedSeats.length === 0) {
                const preselected = findAvailableContiguousSeats(occupiedSeats, seatCount);
                if (preselected.length > 0) {
                  setSelectedSeats(preselected);
                }
              }
              setView('fnb');
            }}
            style={{
              padding: '12px 42px',
              borderRadius: 8,
              background: '#f84464',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.96rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(248,68,100,0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}
          >
            Pay {formatINR(ticketTotal || seatCount * 400)}
          </button>
        </div>
      </div>

      {/* ── 6. "How many seats?" Pop-up Modal (Matching BMS Screenshot 3) ── */}
      {seatModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => e.target === e.currentTarget && setSeatModalOpen(false)}
        >
          <div
            id="how-many-seats-modal"
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: 450,
              maxWidth: '94vw',
              padding: '30px 24px 22px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              color: '#1c1c1c',
              position: 'relative',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, color: '#111827' }}>
              How many seats?
            </h2>

            {/* Dynamic vehicle illustration */}
            <div style={{ marginBottom: 20 }}>
              <VehicleIllustration count={seatCount} />
            </div>

            {/* Number picker 1 to 10 in horizontal circular badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24, overflowX: 'auto', padding: '4px 0' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                const isSelected = seatCount === n;
                return (
                  <button
                    key={n}
                    id={`seat-count-btn-${n}`}
                    onClick={() => setSeatCount(n)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: 'none',
                      background: isSelected ? '#f84464' : 'transparent',
                      color: isSelected ? '#ffffff' : '#1f2937',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            <div style={{ height: 1, background: '#f3f4f6', marginBottom: 18 }} />

            {/* Price Tiers Overview */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  RECLINER ROWS
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', margin: '2px 0' }}>
                  ₹660
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706' }}>
                  ALMOST FULL
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  EXTRA LEGROOM ROWS
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', margin: '2px 0' }}>
                  ₹400
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a' }}>
                  AVAILABLE
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                  PICTURE PERFECT
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', margin: '2px 0' }}>
                  ₹400
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a' }}>
                  AVAILABLE
                </div>
              </div>
            </div>

            {/* Bestseller seats banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: 8,
                padding: '9px 14px',
                fontSize: '0.74rem',
                color: '#92400e',
                marginBottom: 22,
              }}
            >
              <span>Book the</span>
              <div style={{ width: 14, height: 14, borderRadius: 2, border: '1.5px solid #eab308', background: '#fff' }} />
              <strong>Bestseller Seats</strong>
              <span>in this cinema at no extra cost!</span>
            </div>

            {/* Select Seats Button */}
            <button
              id="select-seats-modal-btn"
              onClick={() => {
                setSeatModalOpen(false);
                const preselected = findAvailableContiguousSeats(occupiedSeats, seatCount);
                setSelectedSeats(preselected);
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 8,
                background: '#f84464',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.98rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(248,68,100,0.3)',
              }}
            >
              Select Seats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
