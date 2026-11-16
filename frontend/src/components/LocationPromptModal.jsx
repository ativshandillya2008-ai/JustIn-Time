/**
 * src/components/LocationPromptModal.jsx — Mandatory / Required Location Permission Modal
 * Automatically alerts users to enable geolocation on site launch so that
 * event distances, pre-show dining buffers, and stadium deliveries are calculated accurately.
 */

import React from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Check, X, ShieldCheck } from 'lucide-react';
import { useCity, SUPPORTED_CITIES } from '../contexts/CityContext';

export default function LocationPromptModal() {
  const {
    showLocationModal,
    isDetecting,
    locationPermission,
    requestLocation,
    dismissLocationModal,
    selectedCity,
  } = useCity();

  if (!showLocationModal) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 5, 8, 0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
    }}>
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'linear-gradient(180deg, #1f1f28 0%, #141419 100%)',
          border: '1px solid rgba(252, 128, 25, 0.35)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(252, 128, 25, 0.2)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => dismissLocationModal()}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          title="Continue without GPS"
        >
          <X size={18} />
        </button>

        {/* Pulsing Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--swiggy-orange) 0%, var(--bms-red) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#fff',
            boxShadow: '0 8px 25px rgba(252, 128, 25, 0.5)',
          }}>
            <Navigation size={32} className={isDetecting ? 'animate-spin' : ''} />
          </div>
          <span className="badge badge-orange" style={{ marginBottom: '8px' }}>
            <Compass size={13} /> Location Required for Proximity
          </span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
            Enable Location for Nearby Events
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.55', marginTop: '8px' }}>
            JustIn-Time calculates real-time walking distances from your exact location to venues, pre-show dining reservations, and stadium food stalls.
          </p>
        </div>

        {/* Feature Highlights */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff' }}>
            <ShieldCheck size={18} color="var(--swiggy-orange)" />
            <span><strong>Live Proximity Sorting</strong>: See shows closest to where you are right now.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff' }}>
            <MapPin size={18} color="#34d399" />
            <span><strong>Dineout & Scenes Radius</strong>: Recommends places strictly within 3–5 km.</span>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={requestLocation}
          disabled={isDetecting}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: '800',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
          }}
        >
          {isDetecting ? (
            <>
              <Compass size={18} className="animate-spin" /> Detecting Your Location...
            </>
          ) : (
            <>
              <Navigation size={18} /> Allow Location Access
            </>
          )}
        </button>

        {/* Fallback City Selection */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Or manually choose your metro area
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {SUPPORTED_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => dismissLocationModal(city)}
                style={{
                  background: selectedCity === city ? 'rgba(252, 128, 25, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedCity === city ? '1px solid var(--swiggy-orange)' : '1px solid var(--border-medium)',
                  color: selectedCity === city ? 'var(--swiggy-orange)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
