/**
 * src/contexts/AuthContext.jsx — User & Auth State Management
 * Seamlessly handles Google OAuth and Guest user fallback.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, fbSignOut, isFirebaseConfigured } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('jit_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('jit_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('jit_user');
    }
  }, [user]);

  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      if (isFirebaseConfigured && auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const formattedUser = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          isGuest: false,
          isGoogle: true,
          provider: 'google.com',
        };
        setUser(formattedUser);
        return formattedUser;
      }
      // If Firebase credentials are not supplied, return null so UI triggers interactive Google selector
      return null;
    } catch (err) {
      console.warn('[Auth] Firebase popup error, falling back to Google account chooser:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const setAuthenticatedGoogleUser = (googleUser) => {
    const formattedUser = {
      id: googleUser.id || `google_${Date.now()}`,
      name: googleUser.name || 'Google User',
      email: googleUser.email,
      photoURL: googleUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(googleUser.name || 'G')}&background=4285F4&color=fff`,
      isGuest: false,
      isGoogle: true,
      provider: 'google.com',
    };
    setUser(formattedUser);
    setAuthError(null);
    return formattedUser;
  };

  const loginAsGuest = (guestName = 'Guest Explorer') => {
    const randomId = Math.random().toString(36).substring(2, 7);
    const guestUser = {
      id: `guest_${randomId}`,
      name: guestName,
      email: `${guestName.toLowerCase().replace(/\s+/g, '.')}_${randomId}@justintime.com`,
      photoURL: null,
      isGuest: true,
      isGoogle: false,
      provider: 'guest',
    };
    setUser(guestUser);
    setAuthError(null);
    return guestUser;
  };

  const logout = async () => {
    try {
      if (auth) {
        await fbSignOut(auth);
      }
    } catch (e) {
      // Ignore
    }
    setUser(null);
    localStorage.removeItem('jit_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isFirebaseConfigured,
        loginWithGoogle,
        setAuthenticatedGoogleUser,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
