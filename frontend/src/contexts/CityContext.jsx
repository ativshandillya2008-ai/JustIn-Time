/**
 * src/contexts/CityContext.jsx — City Detection & Localization Context
 * Automatically detects user's location via Geolocation API, mapped to the nearest
 * supported metro city (Bangalore, Mumbai, Delhi, Hyderabad, Chennai), with clean manual selection fallback.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const CityContext = createContext(null);

export const SUPPORTED_CITIES = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Chennai',
];

const CITY_COORDINATES = {
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.2090 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestCity(lat, lng) {
  let nearestCity = 'Mumbai';
  let minDistance = Infinity;

  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = city;
    }
  }

  // If user is within 500km of a city, match it, otherwise default to nearest
  return nearestCity;
}

export function CityProvider({ children }) {
  const [selectedCity, setSelectedCityState] = useState(() => {
    return localStorage.getItem('jit_city') || 'Mumbai';
  });
  const [userCoordinates, setUserCoordinates] = useState(() => {
    const saved = localStorage.getItem('jit_coords');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const setSelectedCity = (city) => {
    setSelectedCityState(city);
    setIsAutoDetected(false);
    localStorage.setItem('jit_city', city);
    // Set fallback city coordinates if no GPS
    const defaultCoords = CITY_COORDINATES[city] || CITY_COORDINATES['Mumbai'];
    if (!userCoordinates) {
      setUserCoordinates(defaultCoords);
    }
  };

  const requestLocation = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      console.warn('[Location] Geolocation not supported by browser.');
      setIsDetecting(false);
      setLocationPermission('denied');
      setShowLocationModal(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserCoordinates(coords);
        localStorage.setItem('jit_coords', JSON.stringify(coords));
        
        const matched = findNearestCity(latitude, longitude);
        console.log(`[Location] Successfully auto-detected: (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) → City: ${matched}`);
        
        setSelectedCityState(matched);
        localStorage.setItem('jit_city', matched);
        setIsAutoDetected(true);
        setIsDetecting(false);
        setLocationPermission('granted');
        setShowLocationModal(false);
      },
      (error) => {
        console.warn('[Location] Geolocation permission denied or unavailable:', error.message);
        setIsDetecting(false);
        setLocationPermission('denied');
        // If user hasn't explicitly allowed GPS, show modal so they know proximity requires location
        const dismissed = sessionStorage.getItem('jit_location_dismissed');
        if (!dismissed) {
          setShowLocationModal(true);
        }
      },
      { timeout: 7000, maximumAge: 300000, enableHighAccuracy: true }
    );
  };

  const dismissLocationModal = (chosenCity = null) => {
    if (chosenCity) {
      setSelectedCity(chosenCity);
    }
    setShowLocationModal(false);
    sessionStorage.setItem('jit_location_dismissed', 'true');
  };

  // Automatically locate user immediately on app open
  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        userCoordinates,
        locationPermission,
        isAutoDetected,
        isDetecting,
        showLocationModal,
        setShowLocationModal,
        requestLocation,
        dismissLocationModal,
        supportedCities: SUPPORTED_CITIES,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
