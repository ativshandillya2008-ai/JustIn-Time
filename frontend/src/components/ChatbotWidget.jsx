/**
 * src/components/ChatbotWidget.jsx — JIT AI Concierge Floating Chatbot
 * Powered by Google Gemini with pitch-safe grounded local NLP engine.
 * Allows conversational event discovery, pre-show dining advice, and orchestration explanation.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Sparkles, Send, X, Minimize2, Maximize2,
  Bot, User, ArrowRight, MapPin, Calendar, Clock, Star, Utensils
} from 'lucide-react';
import api from '../api/client';
import { useCity } from '../contexts/CityContext';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your **JIT Concierge**.\nAsk me about upcoming shows near you, pre-show dining recommendations, or how our real-time orchestration engine works!",
      suggested_actions: [
        "What events are near me?",
        "Suggest dinner before the show",
        "Why was Bolt suppressed?",
        "How does JustIn-Time work?"
      ],
      relevant_items: [],
      engine_source: 'local_grounded_engine',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const { selectedCity, userCoordinates } = useCity();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend = null) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendChatMessage({
        message: text,
        city: selectedCity,
        user_lat: userCoordinates?.lat,
        user_lng: userCoordinates?.lng,
        history: historyPayload,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          suggested_actions: res.suggested_actions || [],
          relevant_items: res.relevant_items || [],
          engine_source: res.engine_source,
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I had trouble reaching the intelligence engine. Please try again!",
          suggested_actions: ["What events are near me?", "How does JustIn-Time work?"],
          relevant_items: [],
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Floating Launcher Trigger ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            background: 'linear-gradient(135deg, var(--swiggy-orange) 0%, var(--bms-red) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50px',
            padding: '12px 20px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 30px rgba(252, 128, 25, 0.45)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="lightning-pulse"
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          <Sparkles size={18} />
          <span style={{ fontWeight: '800', fontSize: '0.88rem', letterSpacing: '-0.2px' }}>
            Ask JIT AI Concierge
          </span>
        </button>
      )}

      {/* ── Open Chat Window Modal ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '390px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 80px)',
            background: 'linear-gradient(180deg, #1b1b24 0%, #121217 100%)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(252, 128, 25, 0.25)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          className="animate-fade-in"
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, rgba(252, 128, 25, 0.2) 0%, rgba(217, 35, 46, 0.15) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--swiggy-orange) 0%, var(--bms-red) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 10px rgba(252, 128, 25, 0.4)',
              }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>JIT Concierge</span>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Grounded in Live BMS & Swiggy Data
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    maxWidth: '86%',
                    padding: '12px 16px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, var(--swiggy-orange) 0%, #ff9638 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                    color: m.role === 'user' ? '#000' : 'var(--text-primary)',
                    fontWeight: m.role === 'user' ? '700' : '400',
                    fontSize: '0.86rem',
                    lineHeight: '1.5',
                    border: m.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                </div>

                {/* Relevant Cards if returned */}
                {m.relevant_items && m.relevant_items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                    {m.relevant_items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'rgba(0, 0, 0, 0.45)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '0.84rem', color: '#fff' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                            {item.distance_km != null && (
                              <span style={{ color: '#34d399', fontWeight: '700' }}>
                                📍 {item.distance_km} km away
                              </span>
                            )}
                            {item.cuisine && <span>{item.cuisine}</span>}
                            {item.start_time && <span>🕒 {item.start_time} IST</span>}
                          </div>
                        </div>

                        {item.type === 'event' && (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/events/${item.id}/seats`);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '6px 10px', fontSize: '0.72rem', borderRadius: 'var(--radius-xs)' }}
                          >
                            <span>Seats</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Action Chips */}
                {m.suggested_actions && m.suggested_actions.length > 0 && idx === messages.length - 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {m.suggested_actions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(action)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--swiggy-orange)',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(252, 128, 25, 0.15)';
                          e.currentTarget.style.borderColor = 'var(--swiggy-orange)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.borderColor = 'var(--border-medium)';
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Sparkles size={14} className="animate-spin" color="var(--swiggy-orange)" />
                <span>JIT Concierge is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <input
              type="text"
              placeholder="Ask about events, dining, Bolt..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputValue.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: inputValue.trim() ? 'var(--swiggy-orange)' : 'rgba(255, 255, 255, 0.08)',
                color: inputValue.trim() ? '#000' : 'var(--text-muted)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
