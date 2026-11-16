/**
 * src/screens/MapExplorerScreen.jsx
 * Live World Map with real-time user location tracking + accurate nearby
 * restaurants and movie theaters via Overpass API (real OpenStreetMap data).
 * Uses Leaflet + OpenStreetMap tiles — no API key required.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation, Utensils, Film, Loader2, RefreshCw,
  MapPin, Star, Clock, ChevronRight, X, AlertCircle,
  Search, Locate, Bot
} from 'lucide-react';
import AgenticScoutModal from '../components/AgenticScoutModal';

// ── Fix leaflet default icon paths broken by bundlers ──────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Overpass API query builder ─────────────────────────────────────────────
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function fetchNearbyPlaces(lat, lng, radiusM = 3000) {
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="restaurant"](around:${radiusM},${lat},${lng});
      node["amenity"="cafe"](around:${radiusM},${lat},${lng});
      node["amenity"="fast_food"](around:${radiusM},${lat},${lng});
      node["amenity"="cinema"](around:${radiusM},${lat},${lng});
      node["amenity"="theatre"](around:${radiusM},${lat},${lng});
      way["amenity"="restaurant"](around:${radiusM},${lat},${lng});
      way["amenity"="cinema"](around:${radiusM},${lat},${lng});
    );
    out center tags;
  `;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}`);
  const json = await res.json();
  return json.elements
    .map(el => {
      const nodeLat = el.type === 'way' ? el.center?.lat : el.lat;
      const nodeLng = el.type === 'way' ? el.center?.lon : el.lon;
      if (!nodeLat || !nodeLng || !el.tags?.name) return null;
      const amenity = el.tags.amenity;
      const isFood = ['restaurant', 'cafe', 'fast_food'].includes(amenity);
      const isCinema = ['cinema', 'theatre'].includes(amenity);
      if (!isFood && !isCinema) return null;
      const dist = haversineKm(lat, lng, nodeLat, nodeLng);
      return {
        id: el.id,
        name: el.tags.name,
        lat: nodeLat,
        lng: nodeLng,
        type: isFood ? 'restaurant' : 'cinema',
        cuisine: el.tags.cuisine,
        opening_hours: el.tags.opening_hours,
        phone: el.tags.phone,
        website: el.tags.website,
        addr: [el.tags['addr:houseno'], el.tags['addr:street'], el.tags['addr:city']]
          .filter(Boolean).join(', ') || null,
        distKm: dist,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 80);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Custom SVG Marker Factories ────────────────────────────────────────────
function makeIcon(color, emoji, size = 36) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    <text x="${size/2}" y="${size/2+5}" text-anchor="middle" font-size="${size*0.45}">${emoji}</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -(size/2 + 4)],
  });
}

const ICONS = {
  user:       makeIcon('#1a73e8', '📍', 40),
  restaurant: makeIcon('#fc8019', '🍽️', 32),
  cinema:     makeIcon('#d9232e', '🎬', 32),
};

// ── Popup HTML builder ──────────────────────────────────────────────────────
function popupHtml(place) {
  const isFood = place.type === 'restaurant';
  const accent = isFood ? '#fc8019' : '#d9232e';
  const distStr = place.distKm < 1
    ? `${Math.round(place.distKm * 1000)} m away`
    : `${place.distKm.toFixed(1)} km away`;
  return `
    <div style="min-width:220px; max-width:280px; padding:14px 16px; font-family:'Plus Jakarta Sans',sans-serif;">
      <div style="font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:${accent}; margin-bottom:4px;">
        ${isFood ? '🍽️ Restaurant / Café' : '🎬 Cinema / Theatre'}
      </div>
      <div style="font-size:1rem; font-weight:800; color:#fff; margin-bottom:6px; line-height:1.3;">${place.name}</div>
      ${place.cuisine ? `<div style="font-size:0.78rem; color:#bbb; margin-bottom:4px;">🍛 ${place.cuisine.replace(/;/g, ' · ')}</div>` : ''}
      ${place.addr ? `<div style="font-size:0.78rem; color:#999; margin-bottom:4px;">📌 ${place.addr}</div>` : ''}
      ${place.opening_hours ? `<div style="font-size:0.76rem; color:#b8f57a; margin-bottom:4px;">🕐 ${place.opening_hours}</div>` : ''}
      ${place.phone ? `<div style="font-size:0.76rem; color:#93c5fd; margin-bottom:4px;">📞 ${place.phone}</div>` : ''}
      <div style="margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1); font-size:0.75rem; color:#666; display:flex; justify-content:space-between; align-items:center;">
        <span style="background:${accent}22; color:${accent}; padding:2px 8px; border-radius:6px; font-weight:700;">${distStr}</span>
        ${place.website ? `<a href="${place.website}" target="_blank" style="color:#93c5fd; font-size:0.72rem; text-decoration:none;">Website ↗</a>` : ''}
      </div>
    </div>`;
}

// ── Tile layer definitions ─────────────────────────────────────────────────
const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  labels: {
    // Hybrid overlay: street names + POI labels over satellite
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
    maxZoom: 19,
    opacity: 1,
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function MapExplorerScreen() {
  const mapRef        = useRef(null); // DOM element
  const leaflet       = useRef(null); // L.Map instance
  const userMarkerRef = useRef(null);
  const pulseRef      = useRef(null);
  const watchIdRef    = useRef(null);
  const markersRef    = useRef([]);
  const popupRef      = useRef(null);
  const baseTileRef   = useRef(null); // active base tile layer
  const labelTileRef  = useRef(null); // labels overlay layer

  const [status, setStatus]           = useState('idle'); // idle|locating|loading|live|error
  const [error, setError]             = useState('');
  const [places, setPlaces]           = useState([]);
  const [filter, setFilter]           = useState('all');  // all|restaurant|cinema
  const [searchQ, setSearchQ]         = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userPos, setUserPos]         = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [accuracy, setAccuracy]       = useState(null);
  const [mapMode, setMapMode]         = useState('satellite'); // satellite|street
  const [agentModalOpen, setAgentModalOpen] = useState(false);

  // ── Initialize Map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (leaflet.current) return;
    leaflet.current = L.map(mapRef.current, {
      center: [20.5937, 78.9629], // India center default
      zoom: 5,
      zoomControl: false,
      attributionControl: true,
    });

    // ── Satellite base layer (ESRI World Imagery) ──
    baseTileRef.current = L.tileLayer(TILE_LAYERS.satellite.url, {
      attribution: TILE_LAYERS.satellite.attribution,
      maxZoom: TILE_LAYERS.satellite.maxZoom,
    }).addTo(leaflet.current);

    // ── Hybrid labels overlay (roads, place names, POI labels) ──
    labelTileRef.current = L.tileLayer(TILE_LAYERS.labels.url, {
      attribution: TILE_LAYERS.labels.attribution,
      maxZoom: TILE_LAYERS.labels.maxZoom,
      opacity: TILE_LAYERS.labels.opacity,
    }).addTo(leaflet.current);

    L.control.zoom({ position: 'bottomright' }).addTo(leaflet.current);

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      leaflet.current?.remove();
      leaflet.current = null;
    };
  }, []);

  // ── Switch between satellite hybrid and street map ──────────────────────
  const switchMapMode = useCallback((mode) => {
    if (!leaflet.current) return;
    setMapMode(mode);

    // Remove existing base + labels
    if (baseTileRef.current)  { baseTileRef.current.remove();  baseTileRef.current = null; }
    if (labelTileRef.current) { labelTileRef.current.remove(); labelTileRef.current = null; }

    if (mode === 'satellite') {
      baseTileRef.current = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: TILE_LAYERS.satellite.attribution,
        maxZoom: TILE_LAYERS.satellite.maxZoom,
      }).addTo(leaflet.current);
      labelTileRef.current = L.tileLayer(TILE_LAYERS.labels.url, {
        attribution: '',
        maxZoom: TILE_LAYERS.labels.maxZoom,
        opacity: 1,
      }).addTo(leaflet.current);
    } else {
      baseTileRef.current = L.tileLayer(TILE_LAYERS.street.url, {
        attribution: TILE_LAYERS.street.attribution,
        maxZoom: TILE_LAYERS.street.maxZoom,
      }).addTo(leaflet.current);
    }

    // Bring marker layers back on top
    markersRef.current.forEach(m => m.bringToFront?.());
    if (userMarkerRef.current) userMarkerRef.current.bringToFront?.();
  }, []);

  // ── Draw / update user live location on map ─────────────────────────────
  const updateUserOnMap = useCallback((lat, lng, acc) => {
    if (!leaflet.current) return;
    setAccuracy(acc);
    setUserPos({ lat, lng });

    // Remove old marker + pulse
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (pulseRef.current) {
      pulseRef.current.remove();
      pulseRef.current = null;
    }

    // Accuracy circle
    const accCircle = L.circle([lat, lng], {
      radius: acc || 50,
      color: '#1a73e8',
      fillColor: '#1a73e8',
      fillOpacity: 0.07,
      weight: 1,
    });

    // Pulsing live dot (DivIcon)
    const liveDot = L.divIcon({
      className: '',
      html: `
        <div style="position:relative; width:24px; height:24px;">
          <div style="
            position:absolute; top:0; left:0; width:24px; height:24px;
            border-radius:50%; background:#1a73e8; opacity:0.25;
            animation: location-pulse 1.6s infinite ease-out;
          "></div>
          <div style="
            position:absolute; top:4px; left:4px; width:16px; height:16px;
            border-radius:50%; background:#1a73e8; border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(26,115,232,0.6);
          "></div>
        </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    userMarkerRef.current = L.marker([lat, lng], { icon: liveDot, zIndexOffset: 1000 })
      .addTo(leaflet.current)
      .bindPopup(`<div style="padding:10px 14px; color:#fff; font-family:sans-serif;">
        <div style="font-weight:800; margin-bottom:4px;">📍 Your Location</div>
        <div style="font-size:0.78rem; color:#aaa;">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
        <div style="font-size:0.72rem; color:#60a5fa; margin-top:4px;">Accuracy: ~${Math.round(acc || 0)} m</div>
      </div>`);

    pulseRef.current = accCircle.addTo(leaflet.current);
  }, []);

  // ── Fetch Nearby Places ─────────────────────────────────────────────────
  const fetchPlaces = useCallback(async (lat, lng) => {
    setStatus('loading');
    setError('');
    try {
      const results = await fetchNearbyPlaces(lat, lng, 5000);
      setPlaces(results);
      setLastRefresh(new Date());

      // Clear old place markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add new markers
      results.forEach(place => {
        const icon = place.type === 'restaurant' ? ICONS.restaurant : ICONS.cinema;
        const marker = L.marker([place.lat, place.lng], { icon })
          .addTo(leaflet.current)
          .bindPopup(popupHtml(place), { maxWidth: 300 });

        marker.on('click', () => setSelectedPlace(place));
        markersRef.current.push(marker);
      });

      setStatus('live');
    } catch (err) {
      console.error('Overpass fetch error:', err);
      setError('Could not load places. Overpass API may be busy. Please retry in a moment.');
      setStatus('error');
    }
  }, []);

  // ── Start Location Tracking ─────────────────────────────────────────────
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Your browser does not support geolocation.');
      setStatus('error');
      return;
    }
    setStatus('locating');
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
        updateUserOnMap(lat, lng, acc);
        leaflet.current?.flyTo([lat, lng], 15, { duration: 1.8 });
        fetchPlaces(lat, lng);

        // Watch for movement
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            const { latitude, longitude, accuracy: a } = p.coords;
            updateUserOnMap(latitude, longitude, a);
          },
          (e) => console.warn('Watch position error:', e),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      },
      (err) => {
        const msgs = {
          1: 'Location permission denied. Please allow location access in your browser settings and try again.',
          2: 'Location unavailable. Your device could not determine a position.',
          3: 'Location request timed out. Please check your GPS signal and retry.',
        };
        setError(msgs[err.code] || 'Location error. Please retry.');
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [updateUserOnMap, fetchPlaces]);

  // ── Refresh places ──────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    if (userPos) fetchPlaces(userPos.lat, userPos.lng);
  }, [userPos, fetchPlaces]);

  // ── Center on user ──────────────────────────────────────────────────────
  const centerOnUser = useCallback(() => {
    if (userPos) leaflet.current?.flyTo([userPos.lat, userPos.lng], 16, { duration: 1 });
  }, [userPos]);

  // ── Filtered & searched places ──────────────────────────────────────────
  const visiblePlaces = places.filter(p => {
    const typeOk = filter === 'all' || p.type === filter;
    const searchOk = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      (p.cuisine || '').toLowerCase().includes(searchQ.toLowerCase());
    return typeOk && searchOk;
  });

  const restaurants = places.filter(p => p.type === 'restaurant');
  const cinemas = places.filter(p => p.type === 'cinema');

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#0d0d11',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 0,
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(13,13,17,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Title */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #1a73e8, #0052cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(26,115,232,0.4)',
          }}>
            <Navigation size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1 }}>Map Explorer</div>
            <div style={{ fontSize: '0.68rem', color: '#666' }}>Live location · Real POI data</div>
          </div>
        </div>

        {/* Search box */}
        <div style={{
          flex: 1, maxWidth: 320, position: 'relative', minWidth: 180,
        }}>
          <Search size={14} color="#666" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search restaurants, cinemas..."
            style={{
              width: '100%', padding: '7px 12px 7px 30px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              color: '#fff', fontSize: '0.82rem', outline: 'none',
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {[
            { key:'all', label:'All', icon:'🗺️' },
            { key:'restaurant', label:`Food (${restaurants.length})`, icon:'🍽️' },
            { key:'cinema', label:`Cinema (${cinemas.length})`, icon:'🎬' },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: '0.76rem', fontWeight: 700,
              background: filter === key ? (key === 'restaurant' ? '#fc8019' : key === 'cinema' ? '#d9232e' : '#1a73e8') : 'rgba(255,255,255,0.08)',
              color: filter === key ? '#fff' : '#aaa',
              transition: 'all 0.2s',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          {/* Layer Mode Toggle */}
          <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.12)' }}>
            {[
              { mode:'satellite', label:'🛰️ Satellite', title:'ESRI World Imagery (satellite)' },
              { mode:'street',    label:'🗺️ Street',    title:'OpenStreetMap street view' },
            ].map(({ mode, label, title }) => (
              <button
                key={mode}
                onClick={() => switchMapMode(mode)}
                title={title}
                style={{
                  padding: '6px 12px', border:'none', cursor:'pointer',
                  fontSize:'0.76rem', fontWeight:700,
                  background: mapMode === mode ? 'rgba(26,115,232,0.85)' : 'rgba(255,255,255,0.05)',
                  color: mapMode === mode ? '#fff' : '#888',
                  transition:'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Autonomous Agentic AI Scout Button */}
          <button
            onClick={() => setAgentModalOpen(true)}
            title="Open Agentic AI Scout (Live BookMyShow & Swiggy background data)"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(6,182,212,0.4)',
              background: 'rgba(6,182,212,0.12)',
              color: '#22d3ee',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.78rem',
              fontWeight: 700,
              boxShadow: '0 0 12px rgba(6,182,212,0.2)',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <Bot size={14} />
            <span>AI Scout</span>
          </button>

          {userPos && (
            <>
              <button onClick={centerOnUser} title="Center on me" style={{
                padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', color: '#60a5fa', cursor: 'pointer',
                display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem', fontWeight:600,
              }}>
                <Locate size={14} /> Me
              </button>
              <button onClick={handleRefresh} disabled={status === 'loading'} title="Refresh places" style={{
                padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', color: '#a3e635', cursor: 'pointer',
                display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem', fontWeight:600,
              }}>
                <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
                Refresh
              </button>
            </>
          )}

          {(status === 'idle' || status === 'error') && (
            <button onClick={startTracking} style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #1a73e8, #0052cc)',
              color: '#fff', fontWeight: 800, fontSize: '0.82rem',
              display:'flex', alignItems:'center', gap:6,
              boxShadow: '0 3px 12px rgba(26,115,232,0.35)',
            }}>
              <Navigation size={14} /> Find Me
            </button>
          )}
          {status === 'locating' && (
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'#60a5fa', fontSize:'0.82rem' }}>
              <Loader2 size={14} className="animate-spin" /> Locating...
            </div>
          )}
          {status === 'loading' && (
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'#fc8019', fontSize:'0.82rem' }}>
              <Loader2 size={14} className="animate-spin" /> Loading places...
            </div>
          )}
          {status === 'live' && (
            <div style={{
              display:'flex', alignItems:'center', gap:5, fontSize:'0.75rem', fontWeight:700,
              color:'#4ade80', background:'rgba(74,222,128,0.1)', padding:'4px 10px', borderRadius:6,
              border:'1px solid rgba(74,222,128,0.25)',
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', animation:'location-pulse 1.5s infinite' }} />
              LIVE
            </div>
          )}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          position:'absolute', top:56, left:0, right:0, zIndex:400,
          background:'rgba(217,35,46,0.15)', borderBottom:'1px solid rgba(217,35,46,0.3)',
          padding:'10px 16px', display:'flex', alignItems:'center', gap:8, color:'#ff9a9a',
          fontSize:'0.82rem',
        }}>
          <AlertCircle size={15} />
          <span style={{ flex:1 }}>{error}</span>
          <button onClick={() => setError('')} style={{ background:'none', border:'none', color:'#ff9a9a', cursor:'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Map ── */}
      <div
        ref={mapRef}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1,
        }}
      />

      {/* ── Welcome overlay (idle) ── */}
      {status === 'idle' && (
        <div style={{
          position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          zIndex:400, textAlign:'center', pointerEvents:'none',
          background:'rgba(13,13,17,0.88)', backdropFilter:'blur(20px)',
          border:'1px solid rgba(255,255,255,0.1)', borderRadius:20,
          padding:'36px 48px', maxWidth: 420,
        }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>🗺️</div>
          <h2 style={{ fontSize:'1.4rem', fontWeight:800, marginBottom:8 }}>
            Live Location Explorer
          </h2>
          <p style={{ color:'#888', fontSize:'0.88rem', lineHeight:1.6, marginBottom:24 }}>
            Discover <strong style={{color:'#fc8019'}}>real restaurants</strong> and{' '}
            <strong style={{color:'#d9232e'}}>cinema halls</strong> near you using accurate
            OpenStreetMap data. Your live location updates as you move.
          </p>
          <button
            onClick={startTracking}
            style={{
              padding:'12px 32px', borderRadius:12, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg, #1a73e8, #0052cc)',
              color:'#fff', fontWeight:800, fontSize:'0.92rem',
              boxShadow:'0 6px 24px rgba(26,115,232,0.4)',
              display:'inline-flex', alignItems:'center', gap:8, pointerEvents:'all',
            }}
          >
            <Navigation size={18} /> Enable Location & Explore
          </button>
          <p style={{ marginTop:14, fontSize:'0.72rem', color:'#555' }}>
            Location data stays on your device. No tracking servers.
          </p>
        </div>
      )}

      {/* ── Side Panel ── */}
      {status === 'live' && (
        <div style={{
          position:'absolute', right:0, top:56, bottom:0, zIndex:300,
          width: selectedPlace ? 310 : 280,
          background:'rgba(13,13,17,0.93)', backdropFilter:'blur(20px)',
          borderLeft:'1px solid rgba(255,255,255,0.08)',
          display:'flex', flexDirection:'column', overflowY:'auto',
          transition:'width 0.25s ease',
        }}>
          {/* Panel header */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            <div style={{ fontWeight:800, fontSize:'0.88rem', marginBottom:2 }}>
              📍 {visiblePlaces.length} places nearby
            </div>
            {userPos && (
              <div style={{ fontSize:'0.7rem', color:'#555' }}>
                {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}
                {accuracy ? ` · ~${Math.round(accuracy)}m accuracy` : ''}
              </div>
            )}
            {lastRefresh && (
              <div style={{ fontSize:'0.68rem', color:'#444', marginTop:2 }}>
                Updated {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Place list */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 10px' }}>
            {visiblePlaces.length === 0 ? (
              <div style={{ color:'#555', fontSize:'0.82rem', textAlign:'center', paddingTop:32 }}>
                No places found. Try expanding your search radius or adjusting the filter.
              </div>
            ) : (
              visiblePlaces.map(place => {
                const isFood = place.type === 'restaurant';
                const accent = isFood ? '#fc8019' : '#d9232e';
                const isSelected = selectedPlace?.id === place.id;
                return (
                  <div
                    key={place.id}
                    className={`map-place-card ${isSelected ? 'active' : ''}`}
                    style={{ marginBottom:7 }}
                    onClick={() => {
                      setSelectedPlace(place);
                      leaflet.current?.flyTo([place.lat, place.lng], 17, { duration: 0.8 });
                      // Open popup
                      const marker = markersRef.current.find(m => {
                        const p = m.getLatLng();
                        return Math.abs(p.lat - place.lat) < 0.00001 && Math.abs(p.lng - place.lng) < 0.00001;
                      });
                      marker?.openPopup();
                    }}
                  >
                    {/* Category icon */}
                    <div style={{
                      width:34, height:34, borderRadius:8, flexShrink:0,
                      background: `${accent}22`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1rem',
                    }}>
                      {isFood ? '🍽️' : '🎬'}
                    </div>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {place.name}
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'#666', marginTop:1 }}>
                        {place.cuisine ? `${place.cuisine} · ` : ''}
                        {place.distKm < 1 ? `${Math.round(place.distKm*1000)}m` : `${place.distKm.toFixed(1)}km`}
                      </div>
                    </div>
                    <ChevronRight size={14} color="#444" />
                  </div>
                );
              })
            )}
          </div>

          {/* Stats footer */}
          <div style={{
            padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0,
            display:'flex', gap:12,
          }}>
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#fc8019' }}>{restaurants.length}</div>
              <div style={{ fontSize:'0.68rem', color:'#555' }}>Restaurants</div>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.07)' }} />
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#d9232e' }}>{cinemas.length}</div>
              <div style={{ fontSize:'0.68rem', color:'#555' }}>Cinemas</div>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.07)' }} />
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#4ade80' }}>5km</div>
              <div style={{ fontSize:'0.68rem', color:'#555' }}>Radius</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Selected place card (bottom left, mobile-friendly) ── */}
      {selectedPlace && status === 'live' && (
        <div style={{
          position:'absolute', bottom:16, left:16, zIndex:400, maxWidth:340,
          background:'rgba(20,20,28,0.95)', backdropFilter:'blur(20px)',
          border:`1px solid ${selectedPlace.type === 'restaurant' ? 'rgba(252,128,25,0.4)' : 'rgba(217,35,46,0.4)'}`,
          borderRadius:14, padding:'14px 16px',
          boxShadow:'0 10px 40px rgba(0,0,0,0.6)',
          animation:'fadeIn 0.25s ease forwards',
        }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{
              width:40, height:40, borderRadius:10, flexShrink:0,
              background: selectedPlace.type === 'restaurant' ? 'rgba(252,128,25,0.15)' : 'rgba(217,35,46,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem',
            }}>
              {selectedPlace.type === 'restaurant' ? '🍽️' : '🎬'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#fff', marginBottom:2 }}>{selectedPlace.name}</div>
              {selectedPlace.cuisine && (
                <div style={{ fontSize:'0.76rem', color:'#aaa', marginBottom:3 }}>{selectedPlace.cuisine}</div>
              )}
              {selectedPlace.addr && (
                <div style={{ fontSize:'0.73rem', color:'#666', marginBottom:3 }}>📌 {selectedPlace.addr}</div>
              )}
              {selectedPlace.opening_hours && (
                <div style={{ fontSize:'0.72rem', color:'#86efac' }}>🕐 {selectedPlace.opening_hours}</div>
              )}
            </div>
            <button onClick={() => setSelectedPlace(null)} style={{
              background:'none', border:'none', color:'#555', cursor:'pointer', flexShrink:0,
            }}>
              <X size={16} />
            </button>
          </div>
          <div style={{
            marginTop:10, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.08)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span style={{
              fontSize:'0.75rem', fontWeight:700, padding:'3px 10px', borderRadius:6,
              background: selectedPlace.type === 'restaurant' ? 'rgba(252,128,25,0.15)' : 'rgba(217,35,46,0.15)',
              color: selectedPlace.type === 'restaurant' ? '#fc8019' : '#f87171',
            }}>
              {selectedPlace.distKm < 1 ? `${Math.round(selectedPlace.distKm * 1000)}m away` : `${selectedPlace.distKm.toFixed(1)}km away`}
            </span>
            {selectedPlace.website && (
              <a href={selectedPlace.website} target="_blank" rel="noreferrer" style={{
                fontSize:'0.72rem', color:'#60a5fa', textDecoration:'none', fontWeight:600,
              }}>
                Website ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Attribution override so it doesn't overlap controls */}
      <style>{`
        .leaflet-bottom.leaflet-right { bottom: 8px; right: 296px; }
        .leaflet-control-zoom { margin-bottom: 12px !important; margin-right: 12px !important; }
        .leaflet-control-zoom a {
          background: rgba(20,20,28,0.92) !important;
          color: #fff !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover { background: rgba(40,40,60,0.95) !important; }
        .leaflet-bar { border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 8px !important; overflow: hidden; }
        .leaflet-bar a:first-child { border-radius: 8px 8px 0 0 !important; }
        .leaflet-bar a:last-child { border-radius: 0 0 8px 8px !important; }
      `}</style>

      <AgenticScoutModal
        isOpen={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
      />
    </div>
  );
}
