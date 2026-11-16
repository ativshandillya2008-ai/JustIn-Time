/**
 * src/components/LaneCard.jsx — Swiggy-Style Active Lane Recommendation Card
 * Displays real restaurants (Dineout), scene events (Scenes), or food stalls (Bolt).
 */

import React from 'react';
import { Utensils, Sparkles, Zap, Star, MapPin, Clock, ArrowRight, Check } from 'lucide-react';
import { formatINR } from '../utils/seatHelpers';

export default function LaneCard({ laneDetail, onSelect, isSelected, isSubmitting }) {
  const { lane, reason, items_count, items } = laneDetail;

  const laneConfigs = {
    dineout: {
      title: 'Swiggy Dineout',
      tagline: 'Pre-Show Dining Reservation',
      icon: Utensils,
      color: 'var(--swiggy-orange)',
      bgLight: 'var(--swiggy-orange-light)',
      borderColor: 'rgba(252, 128, 25, 0.4)',
      badgeClass: 'badge-orange',
      kpiNote: 'Target: Table reservation intent',
    },
    scenes: {
      title: 'Swiggy Scenes',
      tagline: 'Nearby Discovery Experience',
      icon: Sparkles,
      color: 'var(--accent-purple)',
      bgLight: 'var(--accent-purple-light)',
      borderColor: 'rgba(139, 92, 246, 0.4)',
      badgeClass: 'badge-purple',
      kpiNote: 'Target: Qualified discovery rate',
    },
    bolt: {
      title: 'Swiggy Bolt',
      tagline: 'Instant In-Seat Stadium Delivery',
      icon: Zap,
      color: 'var(--accent-green)',
      bgLight: 'var(--accent-green-light)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      badgeClass: 'badge-green',
      kpiNote: 'Target: Zero-friction in-venue conversion',
    },
  };

  const config = laneConfigs[lane] || {
    title: lane.toUpperCase(),
    tagline: 'Personalized Suggestion',
    icon: Sparkles,
    color: '#fff',
    bgLight: 'rgba(255,255,255,0.1)',
    borderColor: '#444',
    badgeClass: 'badge-subtle',
  };

  const Icon = config.icon;

  return (
    <div
      className={`card animate-fade-in ${isSelected ? 'pulse-glow' : 'card-hover'}`}
      style={{
        background: 'linear-gradient(180deg, #1c1c24 0%, #131317 100%)',
        border: isSelected ? `2px solid ${config.color}` : `1px solid ${config.borderColor}`,
        borderTop: `4px solid ${config.color}`,
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isSelected
          ? `0 0 30px ${config.bgLight}, var(--shadow-card-hover)`
          : 'var(--shadow-card)',
      }}
    >
      {/* Top Banner with Icon & Lane Title */}
      <div style={{
        padding: '22px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: config.bgLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: config.color,
            boxShadow: `0 4px 14px ${config.bgLight}`,
          }}>
            <Icon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.28rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>
                {config.title}
              </h3>
              <span className={`badge ${config.badgeClass}`}>
                {items_count} {items_count === 1 ? 'Option' : 'Options'}
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: '500' }}>
              {config.tagline}
            </p>
          </div>
        </div>

        {isSelected && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: config.color,
            color: '#000',
            fontWeight: '800',
            fontSize: '0.75rem',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: `0 2px 10px ${config.bgLight}`,
          }}>
            <Check size={14} /> SELECTED
          </div>
        )}
      </div>

      {/* Engine Decision Reasoning Box */}
      <div style={{
        margin: '18px 24px 14px 24px',
        padding: '12px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderRadius: 'var(--radius-md)',
        borderLeft: `3px solid ${config.color}`,
        border: '1px solid var(--border-subtle)',
        borderLeftWidth: '3px',
        fontSize: '0.84rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
      }}>
        <strong style={{ color: '#fff', marginRight: '6px', fontWeight: '700' }}>Orchestration Logic:</strong>
        {reason}
      </div>

      {/* Real Items List (Rendered dynamically from Backend payload) */}
      <div style={{ padding: '0 24px 16px 24px', flex: 1 }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '10px',
        }}>
          Curated Suggestions
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Specific rendering per lane type */}
                {lane === 'dineout' && (
                  <>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span>{item.cuisine}</span>
                        <span>•</span>
                        <span>{formatINR(item.price_for_two)} for two</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                        <Star size={12} fill="currentColor" /> {item.avg_rating || '4.2'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {item.distance_km} km away
                      </div>
                    </div>
                  </>
                )}

                {lane === 'scenes' && (
                  <>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span className="badge badge-purple" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                          {item.category}
                        </span>
                        <span>{item.venue_name || 'Nearby Venue'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {item.entry_fee === 0 ? 'FREE ENTRY' : formatINR(item.entry_fee)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.start_time} IST • {item.distance_km} km
                      </div>
                    </div>
                  </>
                )}

                {lane === 'bolt' && (
                  <>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span className="badge badge-green" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                          {item.menu_category || 'Snacks'}
                        </span>
                        <span>{item.vendor_type?.replace('_', ' ') || 'Food Stall'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.8rem', fontWeight: '700' }}>
                        <Clock size={13} /> {item.avg_prep_time_mins || 8} mins prep
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Direct seat drop
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '10px 0' }}>
              No specific item details returned.
            </div>
          )}
        </div>
      </div>

      {/* CTA Footer */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {config.kpiNote}
        </span>

        <button
          onClick={() => onSelect(lane)}
          disabled={isSubmitting}
          className="btn"
          style={{
            backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : config.color,
            color: isSelected ? '#fff' : '#000',
            padding: '10px 20px',
            fontSize: '0.88rem',
            fontWeight: '700',
            borderRadius: 'var(--radius-md)',
            boxShadow: isSelected ? 'none' : `0 4px 14px ${config.bgLight}`,
          }}
        >
          {isSelected ? (
            <>
              <Check size={16} /> Selected
            </>
          ) : (
            <>
              Explore {config.title} <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
