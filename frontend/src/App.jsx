/**
 * src/App.jsx — Application Router & Layout
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CityProvider } from './contexts/CityContext';
import Navbar from './components/Navbar';
import LocationPromptModal from './components/LocationPromptModal';
import ChatbotWidget from './components/ChatbotWidget';
import AuthScreen from './screens/AuthScreen';
import EventListScreen from './screens/EventListScreen';
import SeatMapScreen from './screens/SeatMapScreen';
import OrchestrationScreen from './screens/OrchestrationScreen';
import PilotDashboard from './screens/PilotDashboard';
import FoodOrderScreen from './screens/FoodOrderScreen';
import MapExplorerScreen from './screens/MapExplorerScreen';

function AppLayout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      <LocationPromptModal />
      <main className="main-content">
        {children}
      </main>
      <ChatbotWidget />
      <footer style={{
        textAlign: 'center',
        padding: '24px 20px',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        <div>JustIn-Time • BookMyShow Entertainment × Swiggy Fulfillment Platform</div>
        <div style={{ marginTop: '4px', fontSize: '0.72rem' }}>FastAPI Backend running on :8000 • Vite React Frontend on :5173</div>
      </footer>
    </div>
  );
}


// Simple route guard helper
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CityProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/events" replace />} />
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/events" element={<EventListScreen />} />
              <Route path="/events/:eventId/seats" element={<SeatMapScreen />} />
              <Route path="/orchestration/:bookingId" element={<OrchestrationScreen />} />
              <Route path="/pilot-dashboard" element={<PilotDashboard />} />
              <Route path="/food" element={<FoodOrderScreen />} />
              <Route path="/map" element={<MapExplorerScreen />} />
              <Route path="*" element={<Navigate to="/events" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </CityProvider>
    </AuthProvider>
  );
}
