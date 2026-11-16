/**
 * src/screens/EventListScreen.jsx — BookMyShow-inspired Event Discovery
 *
 * Screens (view states):
 *   'list'       — Hero banner carousel + event poster grid
 *   'detail'     — Full BMS event detail page (backdrop, poster, info, "I'm interested")
 *   'showtimes'  — Venue × showtime selection (date bar, filters, time chips)
 *   'seats'      → navigate to /events/:id/seats (existing SeatMapScreen)
 *
 * Modals:
 *   formatModal  — "Select language and format" (on Book Tickets click)
 *   seatModal    — "How many seats?" (on showtime chip click)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, Heart, Share2,
  ThumbsUp, Play, Clock, MapPin, Star, Calendar,
  RefreshCw, AlertCircle, Filter, SortAsc, X, Check,
  Ticket, Music, Mic, Trophy, Film, Zap, Radio,
} from 'lucide-react';
import api from '../api/client';
import { useCity } from '../contexts/CityContext';

/* ─── Realistic & Accurate Event Visuals Engine ───────────────────── */

// Specific thematic images for prominent BookMyShow events & live shows
const SPECIFIC_EVENT_VISUALS = [
  {
    keywords: ['coldplay', 'spheres'],
    poster: '/assets/images/events/coldplay_poster.jpg',
    banner: '/assets/images/events/coldplay_concert.jpg',
  },
  {
    keywords: ['kbc', 'crorepati', 'kaun banega'],
    poster: '/assets/images/events/kbc_live.jpg',
    banner: '/assets/images/events/kbc_live.jpg',
  },
  {
    keywords: ['samay', 'unfiltered'],
    poster: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['ed sheeran', 'sheeran', 'mathematics'],
    poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['sunburn', 'alan walker', 'walker'],
    poster: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['zakir', 'tathastu'],
    poster: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['arijit', 'symphony'],
    poster: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['ipl', 'cricket', 'screening', 'match'],
    poster: 'https://images.unsplash.com/photo-1531415074868-036b107e7752?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['bassi', 'anubhav'],
    poster: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['kalki', '2898'],
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['anirudh', 'hukum'],
    poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['stree', 'sarkate'],
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['dune'],
    poster: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['deadpool', 'wolverine'],
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1400&h=600&fit=crop',
  },
  {
    keywords: ['fighter'],
    poster: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e6f4?w=600&h=840&fit=crop',
    banner: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1400&h=600&fit=crop',
  },
];

// Rich, diverse palettes for unmapped or dynamically ingested events
const DIVERSE_CATEGORY_POSTERS = {
  concert: [
    '/assets/images/events/coldplay_poster.jpg',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1501386761578-eaa54b1e4a7c?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=840&fit=crop',
  ],
  comedy: [
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=840&fit=crop',
  ],
  sport: [
    'https://images.unsplash.com/photo-1531415074868-036b107e7752?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=840&fit=crop',
  ],
  movie: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=840&fit=crop',
  ],
  other: [
    '/assets/images/events/kbc_live.jpg',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=840&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=840&fit=crop',
  ],
};

const DIVERSE_CATEGORY_BANNERS = {
  concert: [
    '/assets/images/events/coldplay_concert.jpg',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501386761578-eaa54b1e4a7c?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&h=600&fit=crop',
  ],
  comedy: [
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1400&h=600&fit=crop',
  ],
  sport: [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1400&h=600&fit=crop',
  ],
  movie: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1400&h=600&fit=crop',
  ],
  other: [
    '/assets/images/events/kbc_live.jpg',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&h=600&fit=crop',
  ],
};

// Deterministic string hash algorithm ensuring different event names get different images
function hashString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function posterFor(event) {
  if (!event) return DIVERSE_CATEGORY_POSTERS.other[0];
  const name = (event.name || '').toLowerCase();

  // 1. Check specific thematic match
  for (const item of SPECIFIC_EVENT_VISUALS) {
    if (item.keywords.some(kw => name.includes(kw))) {
      return item.poster;
    }
  }

  // 2. Deterministic hash selection across diverse category bank
  const cat = (event.category || 'other').toLowerCase();
  const arr = DIVERSE_CATEGORY_POSTERS[cat] || DIVERSE_CATEGORY_POSTERS.other;
  const idx = hashString(event.name || String(event.id || 0)) % arr.length;
  return arr[idx];
}

function bannerFor(event) {
  if (!event) return DIVERSE_CATEGORY_BANNERS.other[0];
  const name = (event.name || '').toLowerCase();

  // 1. Check specific thematic match
  for (const item of SPECIFIC_EVENT_VISUALS) {
    if (item.keywords.some(kw => name.includes(kw))) {
      return item.banner;
    }
  }

  // 2. Deterministic hash selection across diverse category bank
  const cat = (event.category || 'other').toLowerCase();
  const arr = DIVERSE_CATEGORY_BANNERS[cat] || DIVERSE_CATEGORY_BANNERS.other;
  const idx = hashString(event.name || String(event.id || 0)) % arr.length;
  return arr[idx];
}

/* ─── Category metadata ──────────────────────────────────────────── */
const CAT_META = {
  concert: { label: 'Live Concert',   icon: Music,  color: '#c084fc', formats: ['Floor Standing', 'Seated', 'VIP Lounge', 'Platinum'],  langs: ['English', 'Hindi'] },
  comedy:  { label: 'Stand-up Show',  icon: Mic,    color: '#fbbf24', formats: ['General', 'Premium', 'Front Row'],                       langs: ['English', 'Hindi'] },
  sport:   { label: 'Sports',         icon: Trophy, color: '#34d399', formats: ['General Stand', 'East Lower', 'West Lower', 'Corporate'], langs: ['Live'] },
  movie:   { label: 'Movie',          icon: Film,   color: '#f87171', formats: ['2D', 'DOLBY CINEMA 2D', '3D', 'IMAX 3D'],               langs: ['Hindi', 'English', 'Tamil'] },
  other:   { label: 'Event',          icon: Zap,    color: '#38bdf8', formats: ['General', 'Premium'],                                     langs: ['English'] },
};
function metaFor(cat) { return CAT_META[(cat||'other').toLowerCase()] || CAT_META.other; }

/* ─── Showtime generation ────────────────────────────────────────── */
const SLOT_TIMES = ['09:20 AM','10:00 AM','12:30 PM','01:00 PM','03:45 PM','04:10 PM','06:50 PM','07:20 PM','10:00 PM','10:30 PM'];

function genShowtimes(venues, eventId) {
  // Returns array of { venue, slots: [{ time, format, avail }] }
  const seed = eventId || 1;
  return venues.map((v, vi) => {
    const count = 6 + (seed + vi) % 5;
    const slots = SLOT_TIMES.slice(0, count).map((t, si) => ({
      time: t,
      format: si % 3 === 2 ? 'LASER ATMOS' : si % 3 === 1 ? 'INSIGNIA' : 'LUXE',
      avail: (seed + vi + si) % 5 !== 0 ? 'available' : 'fast',
    }));
    return { venue: v, slots };
  });
}

/* ─── Date bar helper ────────────────────────────────────────────── */
function nextDays(n = 7) {
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      day: days[d.getDay()],
      date: d.getDate(),
      month: months[d.getMonth()],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : null,
    });
  }
  return out;
}

/* ─── Interest storage key helper ─────────────────────────────── */
const INTEREST_KEY = 'jit_liked_events';

/* ─── Small BMS-style chips ─────────────────────────────────────── */
function Chip({ children, color = '#e2e8f0', bg = 'transparent', border = '#e2e8f0', small }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: small ? '2px 10px' : '4px 14px',
      borderRadius: 20, border: `1px solid ${border}`,
      background: bg, color, fontSize: small ? '0.7rem' : '0.78rem', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

/* ─── Format/Language selection modal ───────────────────────────── */
function FormatModal({ event, onClose, onConfirm }) {
  const meta  = metaFor(event.category);
  const [selectedLang,   setLang]   = useState(meta.langs[0]);
  const [selectedFormat, setFormat] = useState('');

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div id="format-modal" style={{ background:'#fff', borderRadius:16, width:480, maxWidth:'92vw', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.35)', color:'#1c1c1c' }}>
        {/* Header */}
        <div style={{ padding:'16px 22px', borderBottom:'1px solid #e9e9eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'0.75rem', color:'#686b78', marginBottom:2 }}>{event.name}</div>
            <div style={{ fontWeight:800, fontSize:'1.1rem' }}>Select language and format</div>
          </div>
          <button id="close-format-modal" onClick={onClose} style={{ color:'#686b78', cursor:'pointer', padding:4 }}><X size={20}/></button>
        </div>

        {/* Languages */}
        <div style={{ padding:'20px 22px 0' }}>
          {meta.langs.map(lang => (
            <div key={lang} style={{ marginBottom:20 }}>
              <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#686b78', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>{lang}</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {meta.formats.map(fmt => {
                  const active = selectedFormat === `${lang}::${fmt}`;
                  return (
                    <button key={fmt} id={`format-${fmt.replace(/\s/g,'-')}`}
                      onClick={() => { setLang(lang); setFormat(`${lang}::${fmt}`); }}
                      style={{ padding:'8px 18px', borderRadius:20, border:`1.5px solid ${active ? '#d0021b' : '#e2e8f0'}`, background: active?'rgba(208,2,27,0.06)':'#fff', color: active?'#d0021b':'#1c1c1c', fontWeight: active?700:500, fontSize:'0.82rem', cursor:'pointer', transition:'all 0.18s' }}>
                      {fmt}
                    </button>
                  );
                })}
                <button onClick={() => { setLang(lang); setFormat(`${lang}::all`); }}
                  style={{ padding:'8px 18px', borderRadius:20, border:'1.5px solid #e2e8f0', background:'#fff', color:'#686b78', fontSize:'0.82rem', cursor:'pointer' }}>
                  Select all
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding:'16px 22px 20px' }}>
          <button id="confirm-format-btn"
            onClick={() => selectedFormat && onConfirm(selectedLang, selectedFormat)}
            disabled={!selectedFormat}
            style={{ width:'100%', padding:'13px', background: selectedFormat?'#d0021b':'#e2e8f0', color: selectedFormat?'#fff':'#9ca3af', border:'none', borderRadius:8, fontWeight:800, fontSize:'0.95rem', cursor: selectedFormat?'pointer':'not-allowed', transition:'all 0.2s' }}>
            {selectedFormat ? 'Book Tickets →' : 'Choose a format above'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Seat count modal ───────────────────────────────────────────── */
function SeatCountModal({ event, showtime, venue, onClose, onConfirm }) {
  const [count, setCount] = useState(2);
  const tiers = [
    { name: 'PLATINUM', price: 2500, status: 'AVAILABLE' },
    { name: 'GOLD', price: 1200, status: 'AVAILABLE' },
    { name: 'SILVER', price: 800, status: 'FAST FILLING' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div id="seat-count-modal" style={{ background:'#fff', borderRadius:16, width:440, maxWidth:'92vw', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.35)', color:'#1c1c1c', textAlign:'center', padding:'32px 28px 24px' }}>
        <div style={{ fontWeight:800, fontSize:'1.15rem', marginBottom:4 }}>How many seats?</div>
        <div style={{ fontSize:'0.78rem', color:'#686b78', marginBottom:20 }}>
          {venue?.name} · {showtime?.time}
        </div>

        {/* Scooter illustration */}
        <div style={{ fontSize:'3.5rem', marginBottom:18 }}>🛵</div>

        {/* Number picker */}
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:20 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} id={`seat-count-${n}`}
              onClick={() => setCount(n)}
              style={{ width:36, height:36, borderRadius:'50%', border:'none', background: count===n?'#d0021b':'#f5f5f5', color: count===n?'#fff':'#1c1c1c', fontWeight: count===n?800:500, fontSize:'0.9rem', cursor:'pointer', transition:'all 0.18s', flexShrink:0 }}>
              {n}
            </button>
          ))}
        </div>

        <div style={{ height:1, background:'#e9e9eb', marginBottom:16 }} />

        {/* Price tiers */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:20, flexWrap:'wrap' }}>
          {tiers.map(t => (
            <div key={t.name} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#686b78', letterSpacing:'0.05em' }}>{t.name}</div>
              <div style={{ fontSize:'0.95rem', fontWeight:800, color:'#1c1c1c' }}>₹{t.price.toLocaleString()}</div>
              <div style={{ fontSize:'0.68rem', fontWeight:700, color: t.status==='AVAILABLE'?'#22c55e':'#f59e0b' }}>{t.status}</div>
            </div>
          ))}
        </div>

        {/* Bestseller seats banner */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(252,211,77,0.15)', border:'1px solid rgba(252,211,77,0.5)', borderRadius:8, padding:'8px 14px', marginBottom:20, fontSize:'0.75rem', color:'#78350f', justifyContent:'center' }}>
          <span style={{ width:12, height:12, background:'#fcd34d', borderRadius:2, flexShrink:0 }}/>
          Book the <strong style={{ margin:'0 3px' }}>Bestseller Seats</strong> in this venue at no extra cost!
        </div>

        <button id="select-seats-btn" onClick={() => onConfirm(count)}
          style={{ width:'100%', padding:'14px', background:'#d0021b', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:'0.98rem', cursor:'pointer' }}>
          Select Seats
        </button>
      </div>
    </div>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────── */
export default function EventListScreen() {
  const { selectedCity, userCoordinates } = useCity();
  const navigate = useNavigate();

  /* data */
  const [events,  setEvents]  = useState([]);
  const [venues,  setVenues]  = useState({});
  const [venueList, setVenueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [syncing, setSyncing] = useState(false);

  /* ui state */
  const [view,         setView]        = useState('list');   // list|detail|showtimes
  const [activeEvent,  setActiveEvent] = useState(null);
  const [searchQuery,  setSearchQuery] = useState('');
  const [activeCategory, setActiveCat] = useState('all');

  /* modals */
  const [formatModal, setFormatModal] = useState(false);
  const [seatModal,   setSeatModal]   = useState(null);   // { showtime, venue }
  const [likedEvents, setLikedEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(INTEREST_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const toggleLikeEvent = (id) => {
    setLikedEvents(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(INTEREST_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  /* hero carousel */
  const [heroIdx, setHeroIdx]   = useState(0);
  const [dateIdx, setDateIdx]   = useState(0);
  const heroTimer = useRef(null);
  const days = nextDays(7);

  /* ── load ── */
  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [evData, vnData] = await Promise.all([
        api.getEvents({ city: selectedCity, lat: userCoordinates?.lat, lng: userCoordinates?.lng }),
        api.getVenues(),
      ]);
      const vm = {}; vnData.forEach(v => vm[v.id] = v);
      setEvents(evData);
      setVenues(vm);
      setVenueList(vnData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncFeeds = async () => {
    setSyncing(true);
    try {
      await api.triggerAgentScout({
        city: selectedCity || 'Mumbai',
        lat: userCoordinates?.lat,
        lng: userCoordinates?.lng,
        sync_to_database: true,
      });
      await api.syncEvents(false);
      await loadData();
    }
    catch (e) { setError(e.message); }
    finally { setSyncing(false); }
  };

  useEffect(() => { loadData(); }, [selectedCity, userCoordinates]);

  /* hero auto-scroll */
  useEffect(() => {
    if (view !== 'list' || events.length === 0) return;
    heroTimer.current = setInterval(() => setHeroIdx(i => (i + 1) % Math.min(events.length, 5)), 4000);
    return () => clearInterval(heroTimer.current);
  }, [view, events.length]);

  /* ── filtered events ── */
  const filteredEvents = events.filter(e => {
    if (activeCategory !== 'all' && e.category?.toLowerCase() !== activeCategory) return false;
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const heroEvents = events.slice(0, 5);

  /* ── showtimes for active event ── */
  const showtimes = activeEvent ? genShowtimes(venueList.slice(0,4), activeEvent.id) : [];

  /* ═══════════════════════════════════════════════════════════════
     VIEW: SHOWTIMES
  ═══════════════════════════════════════════════════════════════ */
  if (view === 'showtimes' && activeEvent) {
    const meta = metaFor(activeEvent.category);
    const Meta = meta.icon;
    return (
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <button id="back-to-detail-btn" onClick={() => setView('detail')} style={{ color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:'0.85rem', fontWeight:600, background:'none' }}>
              <ChevronLeft size={16}/> Back
            </button>
          </div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:8 }}>{activeEvent.name}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <Chip border="#686b78" color="#686b78">
              <Clock size={11} style={{ marginRight:4 }}/> 2h 30m
            </Chip>
            <Chip border="#686b78" color="#686b78">UA15+</Chip>
            {meta.label.split(' ').slice(0,1).map(g => <Chip key={g} border="#686b78" color="#686b78">{g}</Chip>)}
            <Chip border="#686b78" color="#686b78">{meta.label}</Chip>
          </div>
        </div>

        {/* Date selector bar */}
        <div style={{ background:'var(--bg-surface)', borderRadius:12, padding:'4px 8px', marginBottom:16, display:'flex', gap:0, overflowX:'auto', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', border:'1px solid var(--border-subtle)' }}>
          {days.map((d, i) => {
            const active = dateIdx === i;
            return (
              <button key={i} id={`date-tab-${i}`} onClick={() => setDateIdx(i)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 20px', cursor:'pointer', background:'none', borderBottom: active?'2px solid #d0021b':'2px solid transparent', transition:'all 0.18s', flexShrink:0 }}>
                <span style={{ fontSize:'0.65rem', fontWeight:700, color: active?'#d0021b':'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                  {d.label || d.day}
                </span>
                <span style={{ fontSize:'1.1rem', fontWeight:800, color: active?'#d0021b':'var(--text-primary)', lineHeight:1.2 }}>{d.date}</span>
                <span style={{ fontSize:'0.62rem', color:'var(--text-muted)', textTransform:'uppercase' }}>{d.month}</span>
              </button>
            );
          })}
        </div>

        {/* Filter chips */}
        <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
          {['Hindi · 2D', 'Price Range', 'Special Formats', 'Other Filters', 'Preferred Time', 'Sort By'].map(f => (
            <button key={f} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, background:'var(--bg-surface)', border:'1px solid var(--border-medium)', color:'var(--text-secondary)', fontWeight:600, fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              {f} <ChevronRight size={12}/>
            </button>
          ))}
        </div>

        {/* Availability legend */}
        <div style={{ display:'flex', gap:16, marginBottom:16, fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:9, height:9, borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/> AVAILABLE</span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:9, height:9, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }}/> FAST FILLING</span>
        </div>

        {/* Venue rows */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation:'spin 1s linear infinite', marginBottom:10, opacity:0.4 }}/>
            <div>Loading venues…</div>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="card" style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
            <MapPin size={32} style={{ marginBottom:10, opacity:0.3 }}/>
            <div style={{ fontWeight:700 }}>No venues found for this city</div>
            <div style={{ fontSize:'0.83rem', marginTop:6 }}>Try a different city from the top bar.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {showtimes.map(({ venue, slots }, vi) => (
              <div key={vi} className="card" style={{ padding:'20px 24px' }}>
                {/* Venue name */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-primary)' }}>
                      {venue.name || `Venue ${vi + 1}`}
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>
                      {venue.city || selectedCity} · Cancellation available
                    </div>
                  </div>
                  <Heart size={18} color="var(--text-muted)" style={{ cursor:'pointer', flexShrink:0 }}/>
                </div>

                {/* Amenity icons */}
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  <span title="Food & Beverages" style={{ fontSize:'1rem' }}>🍿</span>
                  <span title="M-Ticket" style={{ fontSize:'1rem' }}>📱</span>
                </div>

                {/* Time chips */}
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {slots.map((s, si) => (
                    <button key={si} id={`showtime-${vi}-${si}`}
                      onClick={() => navigate(`/events/${activeEvent.id}/seats?time=${encodeURIComponent(s.time)}&format=${encodeURIComponent(s.format)}&venueId=${venue.id}&openSeatCount=true`)}
                      style={{
                        display:'flex', flexDirection:'column', alignItems:'center',
                        padding:'8px 14px', borderRadius:6,
                        border: `1.5px solid ${s.avail==='available' ? '#22c55e' : '#f59e0b'}`,
                        background: s.avail==='available' ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)',
                        cursor:'pointer', transition:'all 0.18s', minWidth:88,
                      }}
                      onMouseOver={e => e.currentTarget.style.background = s.avail==='available' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}
                      onMouseOut={e => e.currentTarget.style.background = s.avail==='available' ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)'}
                    >
                      <span style={{ fontWeight:800, fontSize:'0.88rem', color:'var(--text-primary)' }}>{s.time}</span>
                      <span style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:2 }}>{s.format}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seat count modal */}
        {seatModal && (
          <SeatCountModal
            event={activeEvent}
            showtime={seatModal.showtime}
            venue={seatModal.venue}
            onClose={() => setSeatModal(null)}
            onConfirm={(seatCount) => {
              setSeatModal(null);
              navigate(`/events/${activeEvent.id}/seats`);
            }}
          />
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     VIEW: DETAIL
  ═══════════════════════════════════════════════════════════════ */
  if (view === 'detail' && activeEvent) {
    const meta    = metaFor(activeEvent.category);
    const Meta    = meta.icon;
    const venue   = venues[activeEvent.venue_id];
    const banner  = bannerFor(activeEvent);
    const poster  = posterFor(activeEvent);
    const liked = !!likedEvents[activeEvent.id];
    const toggleLike = () => toggleLikeEvent(activeEvent.id);
    const interestCount = ((activeEvent.id || 1) * 12341 % 900000 + 10000);

    return (
      <div className="animate-fade-in">
        {/* Back */}
        <button id="detail-back-btn" onClick={() => setView('list')}
          style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', cursor:'pointer', marginBottom:16, background:'none', fontSize:'0.85rem', fontWeight:600 }}>
          <ChevronLeft size={16}/> All Events
        </button>

        {/* ── Hero backdrop ── */}
        <div style={{ position:'relative', borderRadius:16, overflow:'hidden', marginBottom:28, minHeight:340 }}>
          {/* Backdrop image */}
          <img src={banner} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e=>{e.currentTarget.src=FALLBACK_BANNER;}}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.25) 100%)' }}/>

          {/* Share button */}
          <button style={{ position:'absolute', top:16, right:16, display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', borderRadius:20, padding:'6px 14px', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
            <Share2 size={14}/> Share
          </button>

          {/* Content row */}
          <div style={{ position:'relative', padding:'28px 28px 32px', display:'flex', gap:28, alignItems:'flex-end', minHeight:340, flexWrap:'wrap' }}>
            {/* Poster */}
            <div style={{ width:160, flexShrink:0 }}>
              <div style={{ position:'relative', borderRadius:10, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', aspectRatio:'5/7' }}>
                <img src={poster} alt={activeEvent.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e=>{e.currentTarget.src=FALLBACK_POSTER;}}/>
                {/* Play overlay */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.7)', padding:'8px', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                  <Play size={13} fill="#fff" color="#fff"/>
                  <span style={{ color:'#fff', fontSize:'0.72rem', fontWeight:700 }}>Trailer</span>
                </div>
              </div>
              {activeEvent.date && (
                <div style={{ marginTop:8, textAlign:'center', fontSize:'0.72rem', color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
                  {new Date(activeEvent.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:200 }}>
              <h1 style={{ fontSize:'1.8rem', fontWeight:900, color:'#fff', marginBottom:14, lineHeight:1.2 }}>
                {activeEvent.name}
              </h1>

              {/* Interest button */}
              <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:20, background:'rgba(0,0,0,0.45)', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.2)', maxWidth:380 }}>
                <div style={{ flex:1, padding:'12px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <ThumbsUp size={16} color="#22c55e" fill={liked?'#22c55e':'none'}/>
                    <span style={{ color:'#fff', fontWeight:800, fontSize:'0.92rem' }}>
                      {(interestCount + (liked ? 1 : 0)).toLocaleString()}+ are interested
                    </span>
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)', marginTop:2 }}>
                    {liked ? 'Added to your Wishlist' : 'Mark interested to add it to your Wishlist'}
                  </div>
                </div>
                <button id="im-interested-btn" onClick={toggleLike}
                  style={{ padding:'12px 18px', background: liked?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.12)', border:'none', borderLeft:'1px solid rgba(255,255,255,0.2)', color: liked?'#4ade80':'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {liked ? '✓ Interested' : "I'm interested"}
                </button>
              </div>

              {/* Meta */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.85rem' }}>2h 30m</span>
                <span style={{ color:'rgba(255,255,255,0.4)' }}>•</span>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.85rem' }}>{meta.label}</span>
                <span style={{ color:'rgba(255,255,255,0.4)' }}>•</span>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.85rem' }}>UA15+</span>
                {venue && <><span style={{ color:'rgba(255,255,255,0.4)' }}>•</span>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:4 }}><MapPin size={12}/>{venue.city}</span></>}
              </div>

              {/* Format tags */}
              <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
                {meta.formats.slice(0,3).map(f => (
                  <Chip key={f} border="rgba(255,255,255,0.3)" color="rgba(255,255,255,0.85)">{f}</Chip>
                ))}
              </div>

              {/* Language tags */}
              <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' }}>
                {meta.langs.map(l => <Chip key={l} border="rgba(255,255,255,0.2)" color="rgba(255,255,255,0.6)" small>{l}</Chip>)}
              </div>

              {/* Book Tickets CTA */}
              <button id="book-tickets-btn" onClick={() => setFormatModal(true)}
                style={{ padding:'14px 36px', background:'#d0021b', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:'1rem', cursor:'pointer', boxShadow:'0 4px 20px rgba(208,2,27,0.5)', transition:'all 0.2s' }}
                onMouseOver={e=>e.currentTarget.style.background='#b00115'}
                onMouseOut={e=>e.currentTarget.style.background='#d0021b'}>
                Book Tickets
              </button>
            </div>
          </div>
        </div>

        {/* About section */}
        <div className="card" style={{ padding:'24px 28px', marginBottom:20 }}>
          <h2 style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:12, color:'var(--text-primary)' }}>About the event</h2>
          <div style={{ color:'var(--text-secondary)', fontSize:'0.88rem', lineHeight:1.7 }}>
            {activeEvent.description || `Experience an unforgettable ${meta.label} at ${venue?.name || 'a premier venue'}. This event promises world-class entertainment in an immersive atmosphere. Tickets are going fast — secure yours now and enjoy an evening you'll never forget.`}
          </div>
          {venue && (
            <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:8, color:'var(--text-muted)', fontSize:'0.82rem' }}>
              <MapPin size={14}/>
              <span>{venue.name}{venue.address ? ` · ${venue.address}` : ''}</span>
            </div>
          )}
        </div>

        {/* Format modal */}
        {formatModal && (
          <FormatModal
            event={activeEvent}
            onClose={() => setFormatModal(false)}
            onConfirm={(lang, fmt) => {
              setFormatModal(false);
              const fmtName = fmt?.includes('::') ? fmt.split('::')[1] : (fmt || '2D');
              navigate(`/events/${activeEvent.id}/seats?format=${encodeURIComponent(fmtName)}&lang=${encodeURIComponent(lang || 'Hindi')}&openSeatCount=true`);
            }}
          />
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     VIEW: LIST  (BMS homepage style)
  ═══════════════════════════════════════════════════════════════ */
  const categories = ['all', 'concert', 'comedy', 'sport', 'movie', 'other'];
  const catIcons   = { all: Ticket, concert: Music, comedy: Mic, sport: Trophy, movie: Film, other: Zap };
  const catLabels  = { all: 'All', concert: 'Concerts', comedy: 'Comedy', sport: 'Sports', movie: 'Movies', other: 'Others' };

  return (
    <div className="animate-fade-in">
      {/* ── Search bar ── */}
      <div style={{ position:'relative', marginBottom:24 }}>
        <Search size={16} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input id="event-search" type="text" placeholder="Search for Movies, Events, Plays, Sports and Activities"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ width:'100%', padding:'14px 18px 14px 46px', background:'var(--bg-surface)', border:'1px solid var(--border-medium)', borderRadius:12, color:'var(--text-primary)', fontSize:'0.9rem', outline:'none', boxShadow:'0 2px 10px rgba(0,0,0,0.1)' }}
          onFocus={e=>{e.target.style.borderColor='#d0021b';}}
          onBlur={e=>{e.target.style.borderColor='var(--border-medium)';}}
        />
        {searchQuery && <button onClick={()=>setSearchQuery('')} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', cursor:'pointer' }}><X size={16}/></button>}
      </div>

      {/* ── Hero Banner Carousel ── */}
      {!searchQuery && events.length > 0 && (
        <div style={{ position:'relative', borderRadius:16, overflow:'hidden', marginBottom:32, cursor:'pointer' }}
          onClick={() => { setActiveEvent(heroEvents[heroIdx]); setView('detail'); }}>
          <div style={{ height:300, position:'relative' }}>
            {heroEvents.map((ev, i) => (
              <div key={ev.id} style={{ position:'absolute', inset:0, transition:'opacity 0.7s ease', opacity: i===heroIdx?1:0, pointerEvents: i===heroIdx?'auto':'none' }}>
                <img src={bannerFor(ev)} alt={ev.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e=>{e.currentTarget.src=FALLBACK_BANNER;}}/>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)' }}/>
                <div style={{ position:'absolute', bottom:24, left:28, right:80 }}>
                  <div style={{ fontSize:'0.7rem', fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                    {metaFor(ev.category).label}
                  </div>
                  <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:8 }}>{ev.name}</div>
                  <div style={{ display:'inline-block', padding:'8px 22px', background:'#d0021b', color:'#fff', borderRadius:6, fontWeight:700, fontSize:'0.85rem' }}>
                    Book Now
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prev/Next arrows */}
          {heroEvents.length > 1 && <>
            <button id="hero-prev" onClick={e=>{e.stopPropagation(); clearInterval(heroTimer.current); setHeroIdx(i=>(i-1+heroEvents.length)%heroEvents.length);}}
              style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
              <ChevronLeft size={20}/>
            </button>
            <button id="hero-next" onClick={e=>{e.stopPropagation(); clearInterval(heroTimer.current); setHeroIdx(i=>(i+1)%heroEvents.length);}}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
              <ChevronRight size={20}/>
            </button>
          </>}

          {/* Dot indicators */}
          <div style={{ position:'absolute', bottom:12, right:20, display:'flex', gap:6 }}>
            {heroEvents.map((_, i) => (
              <span key={i} style={{ width: i===heroIdx?20:8, height:8, borderRadius:4, background: i===heroIdx?'#fff':'rgba(255,255,255,0.4)', transition:'all 0.3s ease', cursor:'pointer' }} onClick={e=>{e.stopPropagation();setHeroIdx(i);}}/>
            ))}
          </div>
        </div>
      )}

      {/* ── Category tabs ── */}
      <div style={{ display:'flex', gap:8, marginBottom:24, overflowX:'auto', paddingBottom:4 }}>
        {categories.map(cat => {
          const Icon = catIcons[cat];
          const active = activeCategory === cat;
          return (
            <button key={cat} id={`cat-${cat}`} onClick={() => setActiveCat(cat)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:24, fontWeight:700, fontSize:'0.82rem', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, border: active?'2px solid #d0021b':'1px solid var(--border-medium)', background: active?'rgba(208,2,27,0.1)':'var(--bg-surface)', color: active?'#d0021b':'var(--text-secondary)', transition:'all 0.2s' }}>
              <Icon size={14} color={active?'#d0021b':'currentColor'}/>{catLabels[cat]}
            </button>
          );
        })}

        {/* Sync button */}
        <button id="sync-btn" onClick={syncFeeds} disabled={syncing}
          style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:24, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', color:'var(--text-muted)', fontSize:'0.78rem', fontWeight:600, cursor:syncing?'wait':'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
          <RefreshCw size={13} style={{ animation: syncing?'spin 1s linear infinite':'none' }}/> {syncing ? 'AI Scouting BMS & Swiggy...' : 'Sync BMS & Swiggy'}
        </button>
      </div>

      {/* ── Events grid ── */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, color:'#ef4444', fontSize:'0.85rem' }}>
          <AlertCircle size={16}/> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'72px 0', color:'var(--text-muted)' }}>
          <RefreshCw size={36} style={{ marginBottom:14, opacity:0.35, animation:'spin 1.2s linear infinite' }}/>
          <div style={{ fontWeight:600 }}>Loading events…</div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ textAlign:'center', padding:'72px 0', color:'var(--text-muted)' }}>
          <Ticket size={40} style={{ marginBottom:12, opacity:0.25 }}/>
          <div style={{ fontWeight:700, marginBottom:8 }}>No events found</div>
          <div style={{ fontSize:'0.85rem' }}>Try a different city or category.</div>
          <button onClick={syncFeeds} className="btn btn-primary" style={{ marginTop:16, fontSize:'0.85rem', padding:'10px 24px' }}>
            <RefreshCw size={14}/> Sync Live Events
          </button>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>
              {activeCategory === 'all' ? 'Recommended Events' : catLabels[activeCategory]}
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:500, marginLeft:8 }}>— {selectedCity !== 'all' ? selectedCity : 'All Cities'}</span>
            </div>
            <span style={{ fontSize:'0.78rem', color:'#d0021b', fontWeight:700, cursor:'pointer' }}>See All ›</span>
          </div>

          {/* BMS-style poster grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:20 }}>
            {filteredEvents.map(ev => {
              const meta  = metaFor(ev.category);
              const venue = venues[ev.venue_id];
              const interest = ((ev.id || 1) * 12341 % 900000 + 10000);
              const poster = posterFor(ev);
              const isPromoted = (ev.id || 0) % 5 === 0;

              return (
                <div key={ev.id} id={`event-card-${ev.id}`}
                  onClick={() => { setActiveEvent(ev); setView('detail'); }}
                  style={{ cursor:'pointer', display:'flex', flexDirection:'column' }}>

                  {/* Poster */}
                  <div
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    style={{ position:'relative', borderRadius:10, overflow:'hidden', marginBottom:10, aspectRatio:'5/7', background:'var(--bg-surface-elevated)', transition:'transform 0.25s ease' }}>
                    <img src={poster} alt={ev.name} loading="lazy"
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                      onError={e=>{e.currentTarget.src=FALLBACK_POSTER;}}/>

                    {isPromoted && (
                      <div style={{ position:'absolute', top:8, left:8, background:'#d0021b', color:'#fff', fontSize:'0.62rem', fontWeight:800, padding:'2px 7px', borderRadius:3, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                        PROMOTED
                      </div>
                    )}

                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'24px 10px 8px', background:'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem', fontWeight:700, color:'#fff' }}>
                        <ThumbsUp size={11} color="#22c55e" fill="#22c55e"/>
                        {(interest / 1000).toFixed(0)}K+ Likes
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-primary)', lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {ev.name}
                  </div>
                  {venue?.city && (
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3 }}>{venue.city}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
