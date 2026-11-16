/**
 * src/screens/OrchestrationScreen.jsx — THE CENTERPIECE
 * Displays the real-time orchestration reveal from GET /bookings/{id}/orchestration,
 * renders eligible lane recommendations, displays explicit suppression reasons for filtered lanes,
 * and allows the user to record lane selections or skip to update pilot metrics.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Zap, ShieldCheck, CheckCircle2, ArrowRight, BarChart3, AlertTriangle, Loader2, Sparkles, X } from 'lucide-react';
import api from '../api/client';
import TicketStub from '../components/TicketStub';
import LaneCard from '../components/LaneCard';
import SuppressedLaneCard from '../components/SuppressedLaneCard';

export default function OrchestrationScreen() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Booking & event context passed from seat selection, or loaded from API
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [event, setEvent] = useState(location.state?.event || null);
  const [venue, setVenue] = useState(location.state?.venue || null);

  const [orchestration, setOrchestration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLane, setSelectedLane] = useState(null);
  const [submittingLane, setSubmittingLane] = useState(false);
  const [selectionSuccess, setSelectionSuccess] = useState(null);

  useEffect(() => {
    async function loadOrchestrationData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch the real orchestration results
        const orchData = await api.getOrchestration(bookingId);
        setOrchestration(orchData);

        // 2. If booking/event metadata was not passed via state, fetch it
        if (!booking) {
          const b = await api.getBooking(bookingId);
          setBooking(b);
          if (b.event_id) {
            const ev = await api.getEvent(b.event_id);
            setEvent(ev);
            if (ev.venue_id) {
              const vn = await api.getVenue(ev.venue_id);
              setVenue(vn);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load orchestration:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (bookingId) {
      loadOrchestrationData();
    }
  }, [bookingId]);

  // Handle selecting an eligible lane
  const handleSelectLane = async (lane) => {
    setSelectedLane(lane);
    setSubmittingLane(true);
    try {
      const res = await api.recordLaneSelection(bookingId, lane, true);
      setSelectionSuccess({
        lane,
        message: `Great choice! Swiggy ${lane.toUpperCase()} request initiated.`,
        detail: res.message,
      });
      // Allow user to view success, then provide direct action to view metrics
    } catch (err) {
      console.error('Failed to record lane selection:', err);
      alert(`Could not select lane: ${err.message}`);
      setSelectedLane(null);
    } finally {
      setSubmittingLane(false);
    }
  };

  // Handle skipping all lanes
  const handleSkipAll = async () => {
    setSubmittingLane(true);
    try {
      await api.recordLaneSelection(bookingId, null, false);
      setSelectionSuccess({
        lane: null,
        message: 'No offers selected. Enjoy your show!',
        detail: 'Interaction recorded as dropout in pilot metrics.',
      });
    } catch (err) {
      console.error('Skip failed:', err);
      alert(`Error skipping: ${err.message}`);
    } finally {
      setSubmittingLane(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--swiggy-orange-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
        }}>
          <Zap size={36} color="var(--swiggy-orange)" className="animate-spin" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>
          JustIn-Time Orchestration Engine Running...
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', fontSize: '0.95rem' }}>
          Evaluating venue policy, distance buffer via Haversine, category adjacency, and time-to-show to curate the right Swiggy lanes.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '520px', margin: '60px auto', textAlign: 'center' }}>
        <AlertTriangle size={36} color="var(--bms-red)" style={{ margin: '0 auto 12px auto' }} />
        <h3>Orchestration Evaluation Failed</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 20px 0' }}>{error}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link to="/events" className="btn btn-secondary">
            Back to Events
          </Link>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const eligibleLanes = orchestration?.eligible_lanes || [];
  const suppressedLanes = orchestration?.suppressed_lanes || [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* 1. Confirmed Ticket Stub */}
      <TicketStub
        booking={booking || { id: bookingId, seat_section: 'Gold', price_tier: 1, user_id: 'User' }}
        event={event || { name: orchestration?.event_name, category: 'Event', date: orchestration?.event_date, start_time: orchestration?.event_start_time }}
        venue={venue || { name: orchestration?.venue_name, city: 'Venue' }}
      />

      {/* 2. Success Banner (if user selected or skipped) */}
      {selectionSuccess && (
        <div
          className="animate-fade-in"
          style={{
            maxWidth: '680px',
            margin: '0 auto 28px auto',
            background: selectionSuccess.lane
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: selectionSuccess.lane ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={24} color={selectionSuccess.lane ? '#34d399' : 'var(--text-secondary)'} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                {selectionSuccess.message}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {selectionSuccess.detail}
              </div>
            </div>
          </div>

          <Link
            to="/pilot-dashboard"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}
          >
            <span>View Updated Metrics</span>
            <BarChart3 size={16} />
          </Link>
        </div>
      )}

      {/* 3. Orchestration Summary Bar */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto 32px auto',
        background: 'linear-gradient(145deg, #1c1c21 0%, #151518 100%)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--swiggy-orange) 0%, var(--bms-red) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(252, 128, 25, 0.4)',
          }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
                JustIn-Time Orchestration Result
              </h2>
              <span className="badge badge-orange">Live Engine Decision</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
              {orchestration?.summary}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Time Buffer
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--swiggy-orange)' }}>
              {orchestration?.mins_until_show} mins
            </div>
          </div>
        </div>
      </div>

      {/* 4. Eligible Lanes Section */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 36px auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Eligible Swiggy Lanes</span>
              <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                {eligibleLanes.length} Active
              </span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Ranked by utility & friction: Bolt (zero-friction) → Dineout (table intent) → Scenes (local discovery)
            </p>
          </div>
        </div>

        {eligibleLanes.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: eligibleLanes.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '20px',
          }}>
            {eligibleLanes.map((lane) => (
              <LaneCard
                key={lane.lane}
                laneDetail={lane}
                isSelected={selectedLane === lane.lane}
                isSubmitting={submittingLane}
                onSelect={handleSelectLane}
              />
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
            <p style={{ color: 'var(--text-muted)' }}>All lanes were suppressed for this booking based on timing/venue rules.</p>
          </div>
        )}
      </div>

      {/* 5. Suppressed Lanes Section (Key Pitch Moat) */}
      {suppressedLanes.length > 0 && (
        <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Suppressed Lanes</span>
              <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
                {suppressedLanes.length} Filtered Out
              </span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              JustIn-Time deliberately hides irrelevant lanes rather than spamming users with options that violate venue policy or timing constraints.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {suppressedLanes.map((lane) => (
              <SuppressedLaneCard key={lane.lane} laneDetail={lane} />
            ))}
          </div>
        </div>
      )}

      {/* 6. Skip & Direct Dashboard Actions */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px 24px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
            Prefer not to select an offer right now?
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Skipping logs dropout intent in the pilot metrics dashboard.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSkipAll}
            disabled={submittingLane || selectionSuccess}
            className="btn btn-secondary"
            style={{ padding: '9px 18px', fontSize: '0.85rem' }}
          >
            Skip Offers
          </button>

          <Link
            to="/pilot-dashboard"
            className="btn btn-outline"
            style={{ padding: '9px 18px', fontSize: '0.85rem', gap: '6px' }}
          >
            <span>View Pilot Dashboard</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
