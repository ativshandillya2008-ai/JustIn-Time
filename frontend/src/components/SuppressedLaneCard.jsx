/**
 * src/components/SuppressedLaneCard.jsx — De-emphasized Lane Card
 * Visually communicates engine suppression reasoning — a critical pitch proof point.
 */

import React from 'react';
import { Ban, ShieldAlert, Utensils, Sparkles, Zap } from 'lucide-react';

export default function SuppressedLaneCard({ laneDetail }) {
  const { lane, reason } = laneDetail;

  const laneIcons = {
    dineout: Utensils,
    scenes: Sparkles,
    bolt: Zap,
  };

  const laneNames = {
    dineout: 'Swiggy Dineout',
    scenes: 'Swiggy Scenes',
    bolt: 'Swiggy Bolt',
  };

  const Icon = laneIcons[lane] || Ban;

  return (
    <div
      className="card animate-fade-in"
      style={{
        background: 'linear-gradient(180deg, rgba(26, 26, 32, 0.7) 0%, rgba(18, 18, 22, 0.85) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: '4px solid rgba(217, 35, 46, 0.7)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'rgba(217, 35, 46, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff6b75',
          }}>
            <Icon size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {laneNames[lane] || lane.toUpperCase()}
            </h4>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Filtered by JustIn-Time Policy
            </div>
          </div>
        </div>

        <span className="badge badge-red" style={{ fontSize: '0.7rem', padding: '4px 10px', letterSpacing: '0.6px' }}>
          <Ban size={12} /> SUPPRESSED
        </span>
      </div>

      {/* Suppression Reason Callout */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        border: '1px solid rgba(217, 35, 46, 0.2)',
        fontSize: '0.85rem',
        color: '#ff9999',
        lineHeight: '1.5',
      }}>
        <div style={{ fontWeight: '800', fontSize: '0.74rem', textTransform: 'uppercase', color: '#ff6b75', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}>
          <ShieldAlert size={14} /> Engine Guardrail Triggered:
        </div>
        {reason}
      </div>

      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>⚡ Pitch Proof-Point: Strict relevance filters prevent notification fatigue.</span>
      </div>
    </div>
  );
}
