/**
 * src/screens/PilotDashboard.jsx — Live Pilot Metrics Dashboard
 * Displays real stats from GET /pilot-metrics: summary totals, per-lane conversion rates,
 * and completion ratios to serve as the business measurement proof-point for the pitch.
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, Clock, Zap, Utensils, Sparkles, RefreshCw, RotateCcw, AlertCircle } from 'lucide-react';
import api from '../api/client';
import ResetModal from '../components/ResetModal';

export default function PilotDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPilotMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load pilot metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const lanesConfig = {
    bolt: {
      name: 'Swiggy Bolt',
      icon: Zap,
      color: 'var(--accent-green)',
      badgeClass: 'badge-green',
      metricTarget: 'In-Seat Conversion + Delivery On-Time',
    },
    dineout: {
      name: 'Swiggy Dineout',
      icon: Utensils,
      color: 'var(--swiggy-orange)',
      badgeClass: 'badge-orange',
      metricTarget: 'Table Reservation Intent + Bill Settlement',
    },
    scenes: {
      name: 'Swiggy Scenes',
      icon: Sparkles,
      color: 'var(--accent-purple)',
      badgeClass: 'badge-purple',
      metricTarget: 'Qualified Discovery Click-Through Rate',
    },
  };

  const summary = metrics?.summary || {};
  const lanes = metrics?.lanes || {};

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-orange">
              <TrendingUp size={14} /> METRICS & UNIT ECONOMICS
            </span>
            <span className="badge badge-subtle">
              Live from GET /pilot-metrics
            </span>
          </div>
          <h1 className="screen-title">
            Pilot Performance Dashboard
          </h1>
          <p className="screen-subtitle">
            Measuring intent capture, lane conversion, and completion rates across all live platform orchestrations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchMetrics}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setResetModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}
          >
            <RotateCcw size={15} />
            <span>Reset Platform Baseline</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'var(--bms-red-light)',
          border: '1px solid rgba(217, 35, 46, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertCircle size={24} color="var(--bms-red)" />
          <div>
            <div style={{ fontWeight: '700', color: '#ff6b6b' }}>Failed to load metrics</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Top Summary Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '36px',
      }}>
        {/* Total Orchestrations */}
        <div className="card" style={{ padding: '22px 24px', borderTop: '3px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
              Engine Runs
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: '800', color: '#fff', letterSpacing: '-1px', lineHeight: '1' }}>
            {loading ? '—' : summary.total_orchestrations_run ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Real-time multi-rule evaluations
          </div>
        </div>

        {/* Total Interactions */}
        <div className="card" style={{ padding: '22px 24px', borderTop: '3px solid var(--swiggy-orange)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
              User Interactions
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--swiggy-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--swiggy-orange)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--swiggy-orange)', letterSpacing: '-1px', lineHeight: '1' }}>
            {loading ? '—' : summary.total_lane_interactions ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {summary.total_selections ?? 0} selected • {summary.total_skipped ?? 0} skipped
          </div>
        </div>

        {/* Overall Conversion */}
        <div className="card" style={{ padding: '22px 24px', borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
              Selection Rate
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: '800', color: '#34d399', letterSpacing: '-1px', lineHeight: '1' }}>
            {loading ? '—' : `${summary.overall_selection_rate_pct ?? 0}%`}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Benchmark: ~3× vs cold push notifications
          </div>
        </div>

        {/* Total Selections */}
        <div className="card" style={{ padding: '22px 24px', borderTop: '3px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
              Intent Captures
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
              <Zap size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: '800', color: '#a78bfa', letterSpacing: '-1px', lineHeight: '1' }}>
            {loading ? '—' : summary.total_selections ?? 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            High-intent ticket purchasers converted
          </div>
        </div>
      </div>

      {/* Per-Lane Breakdown Grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>
          Per-Lane Conversion & Delivery Economics
        </h2>
        <span className="badge badge-subtle">
          Real-time Telemetry
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '22px',
        marginBottom: '38px',
      }}>
        {Object.keys(lanesConfig).map((laneKey) => {
          const cfg = lanesConfig[laneKey];
          const data = lanes[laneKey] || {};
          const Icon = cfg.icon;

          const timesShown = data.times_shown ?? 0;
          const timesSelected = data.times_selected ?? 0;
          const timesCompleted = data.times_completed ?? 0;
          const selectionRate = data.selection_rate_pct ?? 0;
          const completionRate = data.completion_rate_pct ?? 0;

          const glowClass = laneKey === 'bolt' ? 'progress-glow-green' : laneKey === 'dineout' ? 'progress-glow-orange' : 'progress-glow-purple';

          return (
            <div
              key={laneKey}
              className="card card-hover"
              style={{
                background: 'linear-gradient(180deg, #1c1c24 0%, #131317 100%)',
                border: '1px solid var(--border-medium)',
                borderTop: `3px solid ${cfg.color}`,
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
              }}
            >
              {/* Lane Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cfg.color,
                  }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
                    {cfg.name}
                  </h3>
                </div>

                <span className={`badge ${cfg.badgeClass}`} style={{ fontSize: '0.72rem' }}>
                  {laneKey}
                </span>
              </div>

              {/* Target KPI subtitle */}
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '18px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                Target: {data.pilot_metric || cfg.metricTarget}
              </div>

              {/* Counts Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '14px 10px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                border: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Shown</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                    {timesShown}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Selected</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: cfg.color, marginTop: '2px' }}>
                    {timesSelected}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Completed</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>
                    {timesCompleted}
                  </div>
                </div>
              </div>

              {/* Selection Rate Bar Chart */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Selection Rate</span>
                  <span style={{ fontWeight: '800', color: '#fff' }}>{selectionRate}%</span>
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div
                    className={glowClass}
                    style={{
                      height: '100%',
                      width: `${Math.min(100, selectionRate)}%`,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Completion Rate Bar Chart */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Completion Ratio</span>
                  <span style={{ fontWeight: '800', color: '#34d399' }}>{completionRate}%</span>
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div
                    className="progress-glow-green"
                    style={{
                      height: '100%',
                      width: `${Math.min(100, completionRate)}%`,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Jury Pitch Callout Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(252, 128, 25, 0.08) 0%, rgba(217, 35, 46, 0.08) 100%)',
        border: '1px solid rgba(252, 128, 25, 0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
          💡 Why JustIn-Time Moves the Needle for Swiggy
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Traditional Swiggy push notifications struggle with low click-through rates. By intercepting <strong>high-intent ticket purchases</strong> from BookMyShow the second they happen, JustIn-Time surfaces relevant food & local experiences right when the user is planning their outing — driving 3× higher conversion with zero intrusive spam.
        </p>
      </div>

      <ResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onResetComplete={() => fetchMetrics()}
      />
    </div>
  );
}
