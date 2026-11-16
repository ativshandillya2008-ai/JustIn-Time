/**
 * src/components/SeatMap.jsx — Interactive Seat Selection Grid
 * Cinema / Stadium style layout with tier separation, aisle walkways, and live occupied simulation.
 */

import React from 'react';
import { ROWS, SEATS_PER_ROW, SEAT_TIERS, getTierForRow, formatINR } from '../utils/seatHelpers';

export default function SeatMap({
  occupiedSeats,
  selectedSeats,
  onSeatToggle,
  maxSelectable = 4,
}) {
  const isOccupied = (seatId) => occupiedSeats.has(seatId);
  const isSelected = (seatId) => selectedSeats.includes(seatId);

  return (
    <div style={{
      background: 'linear-gradient(180deg, #181822 0%, #111116 100%)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-xl)',
      padding: '32px 24px 28px 24px',
      boxShadow: 'var(--shadow-card)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Curved Screen / Stage with Glow & Light Wash */}
      <div className="stage-curved-screen">
        <div className="stage-arc" />
        <div className="stage-light-wash" />
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: 0,
          right: 0,
          textAlign: 'center',
        }}>
          <span style={{
            fontSize: '0.72rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'var(--swiggy-orange)',
            fontWeight: '800',
            textShadow: '0 0 12px rgba(252, 128, 25, 0.6)',
          }}>
            SCREEN / LIVE STAGE
          </span>
        </div>
      </div>

      {/* Seat Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginBottom: '30px',
        padding: '12px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div className="seat-item" style={{ width: '22px', height: '20px', fontSize: '0.65rem', cursor: 'default' }} />
          <span>Available</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div className="seat-item selected" style={{ width: '22px', height: '20px', fontSize: '0.65rem', cursor: 'default' }} />
          <span>Selected</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div className="seat-item occupied" style={{ width: '22px', height: '20px', fontSize: '0.65rem', cursor: 'default' }} />
          <span>Occupied</span>
        </div>
      </div>

      {/* Grid of Rows */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '680px',
        margin: '0 auto',
        overflowX: 'auto',
        paddingBottom: '12px',
      }}>
        {ROWS.map((row) => {
          const tier = getTierForRow(row);
          const isFirstInTier = row === 'A' || row === 'D' || row === 'H';

          return (
            <React.Fragment key={row}>
              {/* Tier Header Divider */}
              {isFirstInTier && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 14px',
                  marginTop: row !== 'A' ? '18px' : '0',
                  borderTop: row !== 'A' ? '1px dashed var(--border-subtle)' : 'none',
                  paddingTop: row !== 'A' ? '18px' : '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-xs)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: SEAT_TIERS[tier].accentColor,
                      boxShadow: `0 0 8px ${SEAT_TIERS[tier].accentColor}`,
                    }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: SEAT_TIERS[tier].accentColor, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {SEAT_TIERS[tier].name} SECTION
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>
                    {formatINR(SEAT_TIERS[tier].price)} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ seat</span>
                  </span>
                </div>
              )}

              {/* Row Seats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Left Row Label */}
                <div style={{
                  width: '24px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}>
                  {row}
                </div>

                {/* 12 Seats with aisles after seat 4 and seat 8 */}
                <div style={{ display: 'flex', gap: '7px', flex: 1, justifyContent: 'center' }}>
                  {Array.from({ length: SEATS_PER_ROW }, (_, idx) => {
                    const seatNum = idx + 1;
                    const seatId = `${row}${seatNum}`;
                    const occupied = isOccupied(seatId);
                    const selected = isSelected(seatId);
                    const addAisle = seatNum === 4 || seatNum === 8;

                    let className = 'seat-item';
                    if (selected) className += ' selected';
                    else if (occupied) className += ' occupied';

                    return (
                      <React.Fragment key={seatId}>
                        <button
                          type="button"
                          disabled={occupied}
                          onClick={() => onSeatToggle(seatId, tier, SEAT_TIERS[tier].price)}
                          title={`${seatId} • ${tier} (${formatINR(SEAT_TIERS[tier].price)})`}
                          className={className}
                        >
                          {occupied ? '✕' : seatNum}
                        </button>
                        {addAisle && <div style={{ width: '18px' }} />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Right Row Label */}
                <div style={{
                  width: '24px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}>
                  {row}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
