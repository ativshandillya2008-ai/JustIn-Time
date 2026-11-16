/**
 * src/components/ResetModal.jsx — Demo State Reset Modal
 * Calls POST /seed to restore the clean state for pitch/demo presentation.
 */

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import api from '../api/client';

export default function ResetModal({ isOpen, onClose, onResetComplete }) {
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    setResetting(true);
    setError(null);
    try {
      const res = await api.resetSeed();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onResetComplete?.(res);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '460px',
        width: '100%',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }} className="animate-fade-in">
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--swiggy-orange-light)',
            color: 'var(--swiggy-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RotateCcw size={22} className={resetting ? 'animate-spin' : ''} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Reset Platform Baseline
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Restore clean database baseline
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
          This triggers <code>POST /seed</code> on the FastAPI backend, refreshing live events, cinema schedules, and dining venues to their original clean baseline.
        </p>

        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bms-red-light)',
            border: '1px solid rgba(217, 35, 46, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: '#ff6b6b',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'var(--accent-green-light)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            <span>Database re-seeded successfully!</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={resetting}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            className="btn btn-primary"
            disabled={resetting || success}
            style={{ padding: '8px 18px', fontSize: '0.9rem' }}
          >
            {resetting ? 'Resetting...' : 'Reset & Re-Seed'}
          </button>
        </div>
      </div>
    </div>
  );
}
