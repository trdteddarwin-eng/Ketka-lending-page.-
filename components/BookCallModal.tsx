import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessConfig } from '../types';
import { QualifyAnswers, BookedAppointment } from '../lib/demoTypes';
import { QualifyForm } from './QualifyForm';

interface BookCallModalProps {
  open: boolean;
  variant: 'completed' | 'already-used';
  config?: BusinessConfig | null;
  booked?: BookedAppointment | null;
  /** e.g. "tedca-skill-nv7wuk/secret" */
  calLink: string;
  /** Cal.com embed namespace, default "30min" */
  calNamespace?: string;
  onClose?: () => void;
}

// Animated green checkmark — same path-draw pattern as ActiveCall's
// "Appointment Booked" block and AgentActivity's DrawnCheck.
const DrawnCheck: React.FC = () => (
  <motion.svg
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    xmlns="http://www.w3.org/2000/svg"
    className="w-3.5 h-3.5 text-paper"
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

// A single recap line with the drawn checkmark badge.
const RecapLine: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: 'spring', damping: 18, stiffness: 220 }}
    className="flex items-start gap-2.5"
  >
    <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 bg-success">
      <DrawnCheck />
    </span>
    <p className="font-sans text-sm text-dark/85 leading-snug">{children}</p>
  </motion.div>
);

const Disclaimer: React.FC = () => (
  <div className="border border-dark/20 bg-offwhite px-3 py-2.5">
    <p className="font-mono text-[9px] font-bold text-dark/50 uppercase tracking-widest mb-1">
      Heads up
    </p>
    <p className="font-sans text-[11px] text-dark/60 leading-relaxed">
      This was a quick demo on a sample dental business. The real voice agent we
      build is fully customized to <span className="font-bold text-dark/80">your</span>{' '}
      business, services, calendar, and brand voice.
    </p>
  </div>
);

// The Cal.com CTA. The data- attributes hook into the Cal embed that App.tsx
// already initialized — no Cal component import needed here.
const CalCTA: React.FC<{ calLink: string; calNamespace: string }> = ({
  calLink,
  calNamespace,
}) => (
  <motion.button
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', damping: 16, stiffness: 200 }}
    data-cal-link={calLink}
    data-cal-namespace={calNamespace}
    data-cal-config='{"layout":"month_view"}'
    className="w-full px-6 py-4 bg-signal text-paper font-mono text-sm font-bold uppercase tracking-widest border border-dark shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111111] transition-all"
  >
    Book your call →
  </motion.button>
);

export const BookCallModal: React.FC<BookCallModalProps> = ({
  open,
  variant,
  config,
  booked,
  calLink,
  calNamespace = '30min',
  onClose,
}) => {
  const [qualified, setQualified] = useState(false);

  // Reset the qualification gate whenever the modal re-opens or switches
  // variant, so a fresh open always starts on the form.
  useEffect(() => {
    if (open) setQualified(false);
  }, [open, variant]);

  if (!open) return null;

  const isCompleted = variant === 'completed';
  const headline = isCompleted ? "That's a wrap 👏" : "Looks like you've already tried the demo. 👋";
  const subline = isCompleted
    ? "Here's what just happened"
    : 'Ready to see it built for YOUR business? Let’s talk.';

  return (
    <AnimatePresence>
      <motion.div
        key="book-call-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/80 px-4 py-8 overflow-y-auto"
        // Close only when the backdrop ITSELF is clicked. We deliberately do NOT
        // stopPropagation on the card — Cal.com detects the "Book your call" click
        // via a document-level listener, which stopPropagation would silently block.
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <motion.div
          key="book-call-card"
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 20, stiffness: 220 }}
          className="relative w-full max-w-md bg-paper border border-dark shadow-[8px_8px_0px_#111111] my-auto"
        >
          {/* Subtle close — booking is the primary path */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-2.5 right-2.5 z-10 flex items-center justify-center w-7 h-7 text-dark/30 hover:text-dark/70 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Header band */}
          <div className="border-b border-dark bg-dark px-5 py-3">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 border border-signal bg-signal/10 text-signal font-mono text-[9px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-signal" />
              {isCompleted ? 'Demo complete' : 'Welcome back'}
            </div>
            <h2 className="font-heading text-2xl font-bold text-paper uppercase tracking-tighter mt-2 leading-none">
              {headline}
            </h2>
            <p className="font-mono text-[10px] text-paper/50 uppercase tracking-widest mt-1.5">
              {subline}
            </p>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Disclaimer — always visible, near the top */}
            <Disclaimer />

            {/* Recap (completed variant only) */}
            {isCompleted && (
              <div className="space-y-2.5">
                <RecapLine delay={0.05}>Handled your call live</RecapLine>
                {booked && (
                  <RecapLine delay={0.15}>
                    Booked <span className="font-bold">{booked.service}</span> for{' '}
                    <span className="font-bold">{booked.name}</span> — {booked.day}{' '}
                    {booked.time}
                  </RecapLine>
                )}
                <RecapLine delay={booked ? 0.25 : 0.15}>
                  Captured the lead automatically
                </RecapLine>
              </div>
            )}

            {/* Qualify gate → reveals the Cal CTA */}
            <AnimatePresence mode="wait">
              {!qualified ? (
                <motion.div
                  key="qualify"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-dark/10 pt-4">
                    <p className="font-mono text-[10px] font-bold text-dark/60 uppercase tracking-widest mb-3">
                      Tell us about you {isCompleted ? '— then grab a time' : ''}
                    </p>
                    <QualifyForm onQualified={() => setQualified(true)} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-dark/10 pt-4 space-y-3"
                >
                  <p className="font-mono text-[10px] text-dark/50 uppercase tracking-widest text-center">
                    You’re all set — pick a time that works
                  </p>
                  <CalCTA calLink={calLink} calNamespace={calNamespace} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
