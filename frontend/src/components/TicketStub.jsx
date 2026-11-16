/**
 * src/components/TicketStub.jsx — BookMyShow Style Perforated Ticket Component
 * Renders the confirmed ticket with barcode, perforated notches, and booking metadata.
 */

import React from 'react';
import { Calendar, Clock, MapPin, Tag, CheckCircle2, QrCode } from 'lucide-react';
import { formatINR } from '../utils/seatHelpers';

export default function TicketStub({ booking, event, venue }) {
  if (!booking) return null;

  const getCategoryBadgeClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'concert': return 'badge-concert';
      case 'comedy': return 'badge-comedy';
      case 'sport': return 'badge-sport';
      case 'movie': return 'badge-movie';
      default: return 'badge-orange';
    }
  };

  // Realistic varying bar widths for Code-128 barcode simulation
  const barPattern = [
    { width: 3, space: 2 },
    { width: 1, space: 1 },
    { width: 4, space: 2 },
    { width: 2, space: 1 },
    { width: 1, space: 3 },
    { width: 3, space: 1 },
    { width: 2, space: 2 },
    { width: 4, space: 1 },
    { width: 1, space: 2 },
    { width: 3, space: 3 },
    { width: 2, space: 1 },
    { width: 4, space: 2 },
    { width: 1, space: 1 },
    { width: 3, space: 2 },
    { width: 2, space: 3 },
    { width: 4, space: 1 },
    { width: 1, space: 2 },
    { width: 3, space: 1 },
    { width: 2, space: 2 },
    { width: 1, space: 1 },
  ];

  return (
    <div className="ticket-stub animate-fade-in" style={{
      maxWidth: '720px',
      margin: '0 auto 36px auto',
      background: 'linear-gradient(145deg, #1f1f27 0%, #141419 100%)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(217, 35, 46, 0.15)',
    }}>
      {/* Perforated Notches on edges */}
      <div className="ticket-notch-left" />
      <div className="ticket-notch-right" />

      {/* Top Banner: BookMyShow Cinema Pass Ribbon */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(217, 35, 46, 0.22) 0%, rgba(217, 35, 46, 0.08) 100%)',
        borderBottom: '1px solid rgba(217, 35, 46, 0.3)',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }} />
          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ff707a', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            BookMyShow Verified Ticket Pass
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600',
          }}>
            Signal ID
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            fontWeight: '700',
            color: '#fff',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid var(--border-subtle)',
            padding: '2px 10px',
            borderRadius: 'var(--radius-xs)',
          }}>
            #{booking.id ? String(booking.id).padStart(5, '0') : '00000'}
          </span>
        </div>
      </div>

      {/* Main Ticket Body */}
      <div style={{ padding: '26px 32px 22px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className={`badge ${getCategoryBadgeClass(event?.category)}`}>
                {event?.category || 'Event'}
              </span>
              <span className="badge badge-subtle">
                Confirmed
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', lineHeight: '1.25', letterSpacing: '-0.3px' }}>
              {event?.name || 'Event Booking'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '8px' }}>
              <MapPin size={16} color="var(--swiggy-orange)" />
              <span style={{ fontWeight: '500' }}>{venue?.name || event?.venue_name || 'Venue'} • {venue?.city || event?.city || 'City'}</span>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(180deg, #252532 0%, #1a1a24 100%)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            textAlign: 'center',
            minWidth: '110px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
              SECTION
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--swiggy-orange)', marginTop: '2px' }}>
              {booking.seat_section || 'Gold'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Tier {booking.price_tier || 1}
            </div>
          </div>
        </div>

        {/* Date & Time Pills */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '14px 18px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Calendar size={16} color="var(--swiggy-orange)" />
            <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
            <span style={{ fontWeight: '700', color: '#fff' }}>{event?.date || 'Today'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Clock size={16} color="var(--swiggy-orange)" />
            <span style={{ color: 'var(--text-secondary)' }}>Showtime:</span>
            <span style={{ fontWeight: '700', color: '#fff' }}>{event?.start_time ? `${event.start_time} IST` : 'Starts Soon'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Tag size={16} color="var(--swiggy-orange)" />
            <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{booking.user_id || 'User'}</span>
          </div>
        </div>
      </div>

      {/* Perforation Line in Middle */}
      <div style={{ position: 'relative', height: '16px', margin: '0 24px' }}>
        <div className="ticket-divider-line" />
      </div>

      {/* Ticket Footer / Barcode & Intent Token */}
      <div style={{
        padding: '16px 32px 20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>
            BOOKMYSHOW × SWIGGY INTENT TOKEN
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.88rem',
            fontWeight: '700',
            color: 'var(--swiggy-orange)',
            letterSpacing: '1.2px',
            marginTop: '3px',
          }}>
            JIT-{(booking.id || 1).toString().padStart(4, '0')}-BMS-SWIGGY
          </div>
        </div>

        {/* Faux Code-128 Barcode Graphic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '3px 8px',
            borderRadius: '3px',
          }}>
            {barPattern.map((bar, idx) => (
              <div
                key={idx}
                style={{
                  width: `${bar.width}px`,
                  marginRight: `${bar.space}px`,
                  height: '26px',
                  backgroundColor: '#000000',
                }}
              />
            ))}
          </div>

          {/* Mini QR code badge for mobile pass feel */}
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}>
            <QrCode size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

