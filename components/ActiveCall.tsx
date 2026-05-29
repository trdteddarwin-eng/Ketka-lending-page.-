import React, { useEffect, useState, useRef } from 'react';
import { BusinessConfig, TranscriptItem } from '../types';
import { Visualizer } from './Visualizer';
import { GeminiLiveService } from '../services/geminiLive';
import { APPOINTMENT_TRIGGER_PHRASES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentActivity } from './AgentActivity';
import { LiveCalendar } from './LiveCalendar';
import { AgentActivityEvent, BookedAppointment } from '../lib/demoTypes';

interface ActiveCallProps {
  config: BusinessConfig;
  onEndCall: () => void;
  service: GeminiLiveService;
  transcript?: TranscriptItem[];
  activity?: AgentActivityEvent[];
  booked?: BookedAppointment | null;
  isReconnecting?: boolean;
  reconnectAttempt?: number;
}

export const ActiveCall: React.FC<ActiveCallProps> = ({
  config,
  onEndCall,
  service,
  transcript = [],
  activity = [],
  booked = null,
  isReconnecting = false,
  reconnectAttempt = 0,
}) => {
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [showAppointmentBooked, setShowAppointmentBooked] = useState(false);
  const [chipIndex, setChipIndex] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const bookedTriggeredRef = useRef(false);

  // 5-minute demo session — surface time REMAINING, not elapsed.
  const SESSION_SECONDS = 300;
  const remaining = Math.max(0, SESSION_SECONDS - duration);
  const lowTime = remaining <= 60;
  const progressPct = (remaining / SESSION_SECONDS) * 100;

  // Suggestion prompts that nudge the caller on what to say. These guide them
  // straight into the impressive actions (booking, FAQs, emergency handling) so
  // they don't freeze on the mic.
  const SUGGESTIONS = [
    'Try: "I’d like to book a cleaning for next week"',
    'Ask: "What are your hours?"',
    'Ask: "Do you take my insurance?"',
    'Say: "I have a toothache — can I get in today?"',
    'Ask: "How much is teeth whitening?"',
    'Try: "Can I reschedule my appointment?"',
  ];

  // Rotate the suggestion every few seconds.
  useEffect(() => {
    const i = setInterval(() => {
      setChipIndex((prev) => (prev + 1) % SUGGESTIONS.length);
    }, 3800);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    service.onVolumeChange = (vol) => {
      setVolume(vol);
    };

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      service.onVolumeChange = null;
    };
  }, [service]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Transcript stays collapsed by default so the live calendar + activity feed
  // remain the focus (and the layout fits the viewport without scrolling).

  // Detect appointment booking from AI responses
  useEffect(() => {
    if (bookedTriggeredRef.current) return;

    const lastModelMsg = [...transcript].reverse().find(t => t.role === 'model');
    if (!lastModelMsg) return;

    const text = lastModelMsg.text.toLowerCase();
    const triggered = APPOINTMENT_TRIGGER_PHRASES.some(phrase => text.includes(phrase));

    if (triggered) {
      bookedTriggeredRef.current = true;
      setShowAppointmentBooked(true);
      setTimeout(() => setShowAppointmentBooked(false), 4000);
    }
  }, [transcript]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndClick = () => {
    setShowEndConfirm(true);
  };

  const confirmEnd = () => {
    setShowEndConfirm(false);
    onEndCall();
  };

  const cancelEnd = () => {
    setShowEndConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full h-[calc(100svh-6rem)] px-3 py-3 md:px-6 md:py-4 relative overflow-hidden"
    >
      {/* Reconnecting Overlay */}
      <AnimatePresence>
        {isReconnecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-paper/90 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-3 h-3 bg-signal animate-ping"></div>
            <p className="font-mono text-xs text-dark/70 uppercase tracking-widest">
              Reconnecting... (Attempt {reconnectAttempt})
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End Call Confirmation Overlay */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-dark/80 flex flex-col items-center justify-center gap-6"
          >
            <p className="font-heading text-2xl font-bold text-paper uppercase tracking-tighter">
              End this call?
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmEnd}
                className="px-8 py-3 bg-signal border border-paper text-paper font-mono text-xs font-bold uppercase tracking-widest hover:bg-signal/80 transition-colors"
              >
                End Call
              </button>
              <button
                onClick={cancelEnd}
                className="px-8 py-3 bg-dark border border-paper/30 text-paper font-mono text-xs font-bold uppercase tracking-widest hover:bg-dark/80 transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointment Booked Animation */}
      <AnimatePresence>
        {showAppointmentBooked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="bg-dark border-2 border-success px-6 py-4 shadow-[4px_4px_0px_#34C759] flex items-center gap-3">
              <div className="w-10 h-10 bg-success flex items-center justify-center shrink-0">
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-paper"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </motion.svg>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-paper uppercase tracking-tighter">
                  Appointment Booked
                </p>
                <p className="font-mono text-[10px] text-paper/60 uppercase tracking-widest">
                  AI handled it automatically
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Compact control strip (always visible at top) ===== */}
      <div className="shrink-0 w-full max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 border border-signal bg-signal/10 text-signal font-mono text-[9px] font-bold uppercase tracking-widest shrink-0">
              <span className="w-1.5 h-1.5 bg-signal animate-pulse"></span>
              LIVE
            </div>
            <div className="w-8 h-8 md:w-9 md:h-9 shrink-0">
              <Visualizer isActive={true} volume={volume} />
            </div>
            <span className="font-mono text-[10px] text-dark/60 uppercase tracking-widest truncate">
              Speaking with {config.firstName}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end leading-none">
              <motion.span
                key={lowTime ? 'low' : 'normal'}
                className={`font-mono text-lg md:text-2xl font-bold tabular-nums tracking-tighter ${lowTime ? 'text-signal' : 'text-dark'}`}
                animate={lowTime ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={lowTime ? { duration: 1, repeat: Infinity } : {}}
              >
                {formatTime(remaining)}
              </motion.span>
              <span className="font-mono text-[8px] text-dark/40 uppercase tracking-widest mt-0.5">
                {lowTime ? 'Wrapping up' : 'Demo left'}
              </span>
            </div>
            <button
              onClick={handleEndClick}
              className="flex items-center gap-1.5 px-3 py-2 bg-signal hover:bg-signal/90 border border-dark text-paper font-mono text-[10px] font-bold uppercase tracking-widest transition-colors active:translate-y-[1px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              End
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-dark/10 mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${lowTime ? 'bg-signal' : 'bg-dark/60'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Disclaimer */}
        <p className="font-mono text-[9px] text-dark/35 tracking-tight text-center mt-1.5 leading-snug">
          Sample demo business — the real agent we build is customized to your business, services &amp; calendar.
        </p>
      </div>

      {/* ===== Hero: live calendar + agent activity. Fills the space and stays
              visible while talking — no scrolling needed to watch it work. ===== */}
      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto mt-2 md:mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 relative z-10 overflow-hidden">
        <div className="min-h-0 overflow-y-auto">
          <LiveCalendar booked={booked} />
        </div>
        <div className="min-h-0 overflow-hidden flex flex-col">
          <AgentActivity events={activity} />
        </div>
      </div>

      {/* Rotating suggestion chips — compact, just above the transcript */}
      <div className="shrink-0 w-full max-w-md mx-auto mt-2 relative z-10">
        <div className="relative h-[40px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={chipIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 px-3 py-2 bg-paper border border-dark border-l-4 border-l-signal text-center shadow-[2px_2px_0px_#111111] flex items-center justify-center gap-2"
            >
              <span className="text-[11px] leading-none">💡</span>
              <p className="font-mono text-[10px] text-dark/80 tracking-tight leading-snug">
                {SUGGESTIONS[chipIndex]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Live Transcript Panel (collapsed by default, compact) */}
      <div className="shrink-0 w-full max-w-2xl mx-auto mt-2 relative z-10">
        {/* Toggle button (always visible, especially useful on mobile) */}
        <button
          onClick={() => setTranscriptExpanded(!transcriptExpanded)}
          className="w-full flex items-center justify-between px-4 py-2 bg-paper border border-dark/20 font-mono text-[10px] text-dark/60 uppercase tracking-widest hover:bg-offwhite transition-colors"
        >
          <span>Live Transcript ({transcript.length})</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 transition-transform ${transcriptExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {transcriptExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-[26vh] overflow-y-auto bg-offwhite border border-t-0 border-dark/20 p-4 space-y-3">
                {transcript.length === 0 ? (
                  <p className="text-center font-mono text-[10px] text-dark/30 uppercase tracking-widest py-4">
                    Waiting for conversation...
                  </p>
                ) : (
                  transcript.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span
                        className={`shrink-0 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                          item.role === 'user'
                            ? 'bg-dark text-paper'
                            : 'bg-signal text-paper'
                        }`}
                      >
                        {item.role === 'user' ? 'You' : 'AI'}
                      </span>
                      <p className="font-sans text-xs text-dark/80 leading-relaxed">{item.text}</p>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
};
