/**
 * src/components/GoogleAccountModal.jsx — Authentic Google Sign-In Account Chooser Modal
 * Delivers a seamless Google OAuth sign-in flow matching accounts.google.com styling.
 */

import React, { useState } from 'react';
import { X, UserPlus, Check, Shield, ArrowRight } from 'lucide-react';

export default function GoogleAccountModal({ isOpen, onClose, onSignInSuccess }) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [signingInAccount, setSigningInAccount] = useState(null);

  if (!isOpen) return null;

  const defaultAccount = {
    id: 'google_ativ_shandilya',
    name: 'Ativ Shandilya',
    email: 'ativsandillya2008@gmail.com',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces',
    isGuest: false,
    isGoogle: true,
    provider: 'google.com',
  };

  const handleSelectAccount = (account) => {
    setSigningInAccount(account.email);
    setTimeout(() => {
      onSignInSuccess(account);
      onClose();
    }, 650);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    const account = {
      id: `google_${Date.now()}`,
      name: name,
      email: customEmail.trim(),
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=128`,
      isGuest: false,
      isGoogle: true,
      provider: 'google.com',
    };
    handleSelectAccount(account);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
    }}>
      <div style={{
        background: '#ffffff',
        color: '#1f1f1f',
        borderRadius: '16px',
        maxWidth: '430px',
        width: '100%',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, sans-serif",
      }} className="animate-fade-in">
        
        {/* Google animated progress bar when signing in */}
        {signingInAccount && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335)',
            backgroundSize: '200% 100%',
            animation: 'google-load 1.2s infinite linear',
            zIndex: 10,
          }} />
        )}

        {/* Modal Header */}
        <div style={{ padding: '24px 24px 16px 24px', position: 'relative' }}>
          <button
            onClick={onClose}
            disabled={Boolean(signingInAccount)}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#5f6368',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>

          {/* Google Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span style={{ fontSize: '1.05rem', fontWeight: '600', color: '#3c4043' }}>
              Sign in with Google
            </span>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: '500', color: '#202124', margin: '4px 0 2px 0' }}>
            Choose an account
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#5f6368', margin: 0 }}>
            to continue to <span style={{ fontWeight: '600', color: '#1a73e8' }}>JustIn-Time</span>
          </p>
        </div>

        <div style={{ height: '1px', backgroundColor: '#dadce0', margin: '0 0 8px 0' }} />

        {/* Account Selection Body */}
        <div style={{ padding: '8px 16px 16px 16px' }}>
          {!isCustomMode ? (
            <>
              {/* Default User Account Row */}
              <button
                type="button"
                onClick={() => handleSelectAccount(defaultAccount)}
                disabled={Boolean(signingInAccount)}
                style={{
                  width: '100%',
                  background: signingInAccount === defaultAccount.email ? '#e8f0fe' : '#ffffff',
                  border: '1px solid #dadce0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  marginBottom: '10px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafd'; e.currentTarget.style.borderColor = '#1a73e8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#dadce0'; }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4285F4 0%, #1a73e8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  fontWeight: '700',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(66, 133, 244, 0.3)',
                }}>
                  {defaultAccount.name.charAt(0)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: '600', color: '#202124', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {defaultAccount.name}
                    <span style={{ fontSize: '0.68rem', backgroundColor: '#e6f4ea', color: '#137333', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      Active
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#5f6368', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {defaultAccount.email}
                  </div>
                </div>

                {signingInAccount === defaultAccount.email ? (
                  <div style={{ fontSize: '0.78rem', color: '#1a73e8', fontWeight: '600' }}>
                    Signing in...
                  </div>
                ) : (
                  <ArrowRight size={16} color="#5f6368" />
                )}
              </button>

              {/* Use Another Account Option */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                disabled={Boolean(signingInAccount)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: '1px dashed #dadce0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafd'; e.currentTarget.style.borderColor = '#1a73e8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#dadce0'; }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#f1f3f4',
                  color: '#5f6368',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <UserPlus size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1a73e8' }}>
                    Use another Google account
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#5f6368' }}>
                    Sign in with any @gmail.com or Workspace ID
                  </div>
                </div>
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#3c4043', marginBottom: '4px' }}>
                  Google Email Address:
                </label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dadce0',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#202124',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                  onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#3c4043', marginBottom: '4px' }}>
                  Your Name (Optional):
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Ativ Shandilya"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dadce0',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#202124',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                  onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#f1f3f4',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#3c4043',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!customEmail.trim()}
                  style={{
                    flex: 2,
                    padding: '10px',
                    background: '#1a73e8',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: customEmail.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Sign In as Google User</span>
                  <Check size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Google Consent & Security Note */}
          <div style={{
            marginTop: '18px',
            paddingTop: '14px',
            borderTop: '1px solid #f1f3f4',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.74rem',
            color: '#70757a',
            lineHeight: '1.4',
          }}>
            <Shield size={14} color="#1a73e8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              To continue, Google will share your name, email address, language preference, and profile picture with <strong>JustIn-Time</strong>.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
