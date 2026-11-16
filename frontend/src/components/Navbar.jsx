/**
 * src/components/Navbar.jsx — Premium Application Header
 * BookMyShow × Swiggy dual branding, live external company links,
 * city localization selector with geolocation detection, and de-emphasized secondary controls.
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, BarChart3, RotateCcw, MapPin, ExternalLink, ChevronDown, Sparkles, User, LogOut, UtensilsCrossed, Map, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCity } from '../contexts/CityContext';
import ResetModal from './ResetModal';
import AgenticScoutModal from './AgenticScoutModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { selectedCity, setSelectedCity, isAutoDetected, supportedCities } = useCity();
  const location = useLocation();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header style={{
        background: 'rgba(18, 18, 23, 0.85)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          {/* Left: Brand Logo & Partner External Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Animated Engine Mark */}
              <div
                className="lightning-pulse"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--bms-red) 0%, var(--swiggy-orange) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(252, 128, 25, 0.45)',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '1.25rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>⚡</span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '1.3rem',
                    fontWeight: '800',
                    letterSpacing: '-0.5px',
                    color: '#fff',
                  }}>
                    JustIn<span style={{ color: 'var(--swiggy-orange)' }}>-Time</span>
                  </span>
                  <span className="badge badge-orange" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                    Engine
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.2px' }}>
                  BookMyShow Intent × Swiggy Fulfillment
                </div>
              </div>
            </Link>

            {/* Live External Partner Links (Part C) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '16px',
              borderLeft: '1px solid var(--border-subtle)',
            }}>
              {/* Real BookMyShow External Link */}
              <a
                href="https://in.bookmyshow.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit live BookMyShow (opens in.bookmyshow.com in new tab)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 11px',
                  backgroundColor: 'rgba(217, 35, 46, 0.12)',
                  border: '1px solid rgba(217, 35, 46, 0.35)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ff6b75',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 8px rgba(217, 35, 46, 0.15)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(217, 35, 46, 0.22)';
                  e.currentTarget.style.borderColor = 'rgba(217, 35, 46, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(217, 35, 46, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(217, 35, 46, 0.35)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* BookMyShow ticket icon SVG */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="16" rx="2"/>
                  <line x1="7" y1="9" x2="17" y2="9"/>
                  <line x1="7" y1="13" x2="17" y2="13"/>
                </svg>
                <span>BookMyShow</span>
                <ExternalLink size={11} style={{ opacity: 0.7 }} />
              </a>

              {/* Real Swiggy External Link */}
              <a
                href="https://www.swiggy.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit live Swiggy (opens swiggy.com in new tab)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 11px',
                  backgroundColor: 'rgba(252, 128, 25, 0.12)',
                  border: '1px solid rgba(252, 128, 25, 0.35)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--swiggy-orange)',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 8px rgba(252, 128, 25, 0.15)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(252, 128, 25, 0.22)';
                  e.currentTarget.style.borderColor = 'rgba(252, 128, 25, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(252, 128, 25, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(252, 128, 25, 0.35)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Swiggy Delivery Pin / Bird icon SVG */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                </svg>
                <span>Swiggy</span>
                <ExternalLink size={11} style={{ opacity: 0.7 }} />
              </a>
            </div>
          </div>

          {/* Center: City Location Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="btn btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                gap: '8px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-medium)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
              title="Change city to see local events & venues"
            >
              <MapPin size={14} color="var(--swiggy-orange)" />
              <span style={{ fontWeight: '700', color: '#fff' }}>
                {selectedCity === 'all' ? 'All Metro Cities' : selectedCity}
              </span>
              {isAutoDetected && (
                <span className="badge badge-sport" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
                  GPS
                </span>
              )}
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {cityDropdownOpen && (
              <div
                className="animate-fade-in"
                style={{
                  position: 'absolute',
                  top: '115%',
                  left: 0,
                  width: '220px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                  padding: '8px',
                  zIndex: 100,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '4px 10px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                  Select City
                </div>
                {supportedCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setCityDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '0.86rem',
                      color: selectedCity === city ? 'var(--swiggy-orange)' : 'var(--text-primary)',
                      backgroundColor: selectedCity === city ? 'rgba(252, 128, 25, 0.12)' : 'transparent',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: selectedCity === city ? '800' : '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{city}</span>
                    {selectedCity === city && <span style={{ color: 'var(--swiggy-orange)', fontWeight: '800' }}>✓</span>}
                  </button>
                ))}
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '6px 0' }} />
                <button
                  onClick={() => {
                    setSelectedCity('all');
                    setCityDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: selectedCity === 'all' ? 'var(--swiggy-orange)' : 'var(--text-secondary)',
                    backgroundColor: selectedCity === 'all' ? 'rgba(252, 128, 25, 0.12)' : 'transparent',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: selectedCity === 'all' ? '800' : '500',
                    cursor: 'pointer',
                  }}
                >
                  All Cities (National View)
                </button>
              </div>
            )}
          </div>

          {/* Right: Primary Events CTA + De-emphasized Admin Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Primary Action: Events */}
            <Link
              to="/events"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: '700',
                color: isActive('/events') ? '#fff' : 'var(--text-secondary)',
                backgroundColor: isActive('/events') ? 'rgba(217, 35, 46, 0.18)' : 'transparent',
                border: isActive('/events') ? '1px solid rgba(217, 35, 46, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Ticket size={16} color={isActive('/events') ? 'var(--bms-red)' : 'currentColor'} />
              <span>Events</span>
            </Link>

            {/* Food Order Link */}
            <Link
              to="/food"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: '700',
                color: isActive('/food') ? '#fff' : 'var(--text-secondary)',
                backgroundColor: isActive('/food') ? 'rgba(252, 128, 25, 0.18)' : 'transparent',
                border: isActive('/food') ? '1px solid rgba(252, 128, 25, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <UtensilsCrossed size={16} color={isActive('/food') ? 'var(--swiggy-orange)' : 'currentColor'} />
              <span>Food</span>
            </Link>

            {/* Map Explorer Link */}
            <Link
              to="/map"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: '700',
                color: isActive('/map') ? '#fff' : 'var(--text-secondary)',
                backgroundColor: isActive('/map') ? 'rgba(26, 115, 232, 0.18)' : 'transparent',
                border: isActive('/map') ? '1px solid rgba(26, 115, 232, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Map size={16} color={isActive('/map') ? '#60a5fa' : 'currentColor'} />
              <span>Map</span>
            </Link>
            <Link
              to="/pilot-dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: '600',
                color: isActive('/pilot-dashboard') ? 'var(--swiggy-orange)' : 'var(--text-muted)',
                backgroundColor: isActive('/pilot-dashboard') ? 'rgba(252, 128, 25, 0.12)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <BarChart3 size={15} color={isActive('/pilot-dashboard') ? 'var(--swiggy-orange)' : 'currentColor'} />
              <span>Dashboard</span>
            </Link>

            {/* Autonomous Agentic AI Scout Trigger Button */}
            <button
              onClick={() => setAgentModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 13px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: '700',
                color: '#22d3ee',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                boxShadow: '0 0 14px rgba(6, 182, 212, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Autonomous Agentic AI Scout: Probing BookMyShow & Swiggy in the background"
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }} />
              <Bot size={15} color="#22d3ee" />
              <span>AI Scout</span>
            </button>

            {/* Reset Baseline Action */}
            <button
              onClick={() => setResetModalOpen(true)}
              className="btn btn-outline"
              title="Reset Database Baseline (POST /seed)"
              style={{
                padding: '7px 10px',
                fontSize: '0.78rem',
                gap: '5px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            {/* User Profile / Guest Badge */}
            {user ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: user.isGoogle || user.provider === 'google.com'
                    ? 'linear-gradient(135deg, #4285F4 0%, #1a73e8 100%)'
                    : 'linear-gradient(135deg, var(--swiggy-orange), #ff9534)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {user.photoURL && !user.photoURL.includes('ui-avatars') ? (
                    <img src={user.photoURL} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>
                    {user.name}
                  </span>
                  {(user.isGoogle || user.provider === 'google.com') && (
                    <span title="Verified Google Account" style={{ fontSize: '0.62rem', backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '0 5px', borderRadius: '4px', fontWeight: '800' }}>
                      Google
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  style={{
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <ResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onResetComplete={() => window.location.reload()}
      />

      <AgenticScoutModal
        isOpen={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
      />
    </>
  );
}
