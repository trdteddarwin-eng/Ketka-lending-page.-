import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentActivityEvent, DemoToolName } from '../lib/demoTypes';

interface AgentActivityProps {
  events: AgentActivityEvent[];
}

const TOOL_ICONS: Record<DemoToolName, string> = {
  check_availability: '📅',
  book_appointment: '📌',
  capture_lead: '👤',
  take_message: '✉️',
  end_call: '👋',
};

// Animated green checkmark — same path-draw pattern as ActiveCall's "Appointment Booked" block.
const DrawnCheck: React.FC = () => (
  <motion.svg
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-paper"
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
      transition={{ duration: 0.5, delay: 0.1 }}
    />
  </motion.svg>
);

export const AgentActivity: React.FC<AgentActivityProps> = ({ events }) => {
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest (bottom).
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  return (
    <div className="w-full bg-paper border border-dark shadow-[4px_4px_0px_#111111]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark bg-dark">
        <span className="font-mono text-[10px] font-bold text-paper uppercase tracking-widest">
          Agent Activity
        </span>
        <span className="w-2 h-2 bg-signal animate-pulse" />
      </div>

      {/* Feed */}
      <div className="max-h-[320px] overflow-y-auto p-3 space-y-2">
        {events.length === 0 ? (
          <p className="font-mono text-[10px] text-dark/40 uppercase tracking-widest py-6 text-center">
            Waiting for the AI to take action…
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                className="flex items-start gap-2.5 bg-offwhite border border-dark/15 px-3 py-2"
              >
                {/* State indicator */}
                <div className="shrink-0 mt-0.5">
                  {event.status === 'done' ? (
                    <span className="flex items-center justify-center w-5 h-5 bg-success">
                      <DrawnCheck />
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center w-5 h-5">
                      <span className="absolute inline-flex w-3 h-3 bg-signal opacity-60 animate-ping" />
                      <span className="relative inline-flex w-2.5 h-2.5 bg-signal" />
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs leading-none">{TOOL_ICONS[event.tool]}</span>
                    <p className="font-mono text-[11px] text-dark leading-snug tracking-tight break-words">
                      {event.label}
                      {event.status === 'running' && (
                        <span className="text-dark/40">…</span>
                      )}
                    </p>
                  </div>
                  {event.detail && (
                    <p className="font-mono text-[9px] text-dark/50 uppercase tracking-widest mt-1 break-words">
                      {event.detail}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};
