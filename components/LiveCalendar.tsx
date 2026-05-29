import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookedAppointment } from '../lib/demoTypes';

interface LiveCalendarProps {
  booked: BookedAppointment | null;
}

// Demo business week (matches Bright Smile Dental hours).
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOTS = ['9:00', '10:30', '2:00', '4:00'];

// Map short day labels to the full names that may appear in booked.day.
const DAY_FULL: Record<string, string> = {
  Mon: 'monday',
  Tue: 'tuesday',
  Wed: 'wednesday',
  Thu: 'thursday',
  Fri: 'friday',
  Sat: 'saturday',
};

// A couple of pre-marked "busy" cells purely for visual realism. A booking
// ALWAYS overrides these (a booked cell renders on top), so they never block or
// conflict with what the AI just confirmed out loud.
const BUSY = new Set(['0-1', '4-3']);

interface MatchResult {
  dayIndex: number;
  slotIndex: number;
}

/**
 * Map the human-readable booked.day/time to the grid cell that best matches
 * what the AI actually said. We do NOT dodge "busy" cells — the booking must
 * land exactly where the AI confirmed it, and the booked overlay takes
 * precedence over any busy mark. Falls back to a sensible default only when the
 * day/time can't be parsed at all.
 */
function matchCell(booked: BookedAppointment): MatchResult {
  const dayStr = booked.day.toLowerCase();
  const timeStr = booked.time.toLowerCase().replace(/\s+/g, '');

  let dayIndex = DAYS.findIndex(
    (d) => dayStr.includes(DAY_FULL[d]) || dayStr.includes(d.toLowerCase())
  );
  let slotIndex = SLOTS.findIndex(
    (s) => timeStr.includes(s.replace(':', '')) || timeStr.includes(s)
  );

  // Defaults if unparseable, so the calendar always shows the booking somewhere
  // sensible (the footer always shows the true day/time regardless).
  if (dayIndex < 0) dayIndex = 0;
  if (slotIndex < 0) slotIndex = 0;

  return { dayIndex, slotIndex };
}

export const LiveCalendar: React.FC<LiveCalendarProps> = ({ booked }) => {
  const match = useMemo(() => (booked ? matchCell(booked) : null), [booked]);

  return (
    <div className="w-full bg-paper border border-dark shadow-[4px_4px_0px_#111111]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark bg-dark">
        <span className="font-mono text-[10px] font-bold text-paper uppercase tracking-widest">
          Live Calendar · Bright Smile Dental
        </span>
        <span className="w-2 h-2 bg-success animate-pulse" />
      </div>

      <div className="p-3">
        {/* Grid: leading time column + one column per day. */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `auto repeat(${DAYS.length}, minmax(0, 1fr))` }}
        >
          {/* Top-left spacer */}
          <div className="px-1.5 py-1" />
          {/* Day headers */}
          {DAYS.map((d) => (
            <div
              key={d}
              className="font-mono text-[9px] text-dark/60 uppercase tracking-widest text-center py-1"
            >
              {d}
            </div>
          ))}

          {/* Rows */}
          {SLOTS.map((slot, slotIndex) => (
            <React.Fragment key={slot}>
              {/* Time label */}
              <div className="font-mono text-[9px] text-dark/60 tracking-tight pr-1.5 flex items-center justify-end">
                {slot}
              </div>

              {/* Day cells */}
              {DAYS.map((d, dayIndex) => {
                const isBusy = BUSY.has(`${dayIndex}-${slotIndex}`);
                const isBooked =
                  match !== null &&
                  match.dayIndex === dayIndex &&
                  match.slotIndex === slotIndex;

                return (
                  <div key={d} className="aspect-[3/2] min-h-[34px] relative">
                    <AnimatePresence mode="wait">
                      {isBooked && booked ? (
                        <motion.div
                          key="booked"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', damping: 12, stiffness: 260 }}
                          className="absolute inset-0 bg-success border-2 border-dark shadow-[2px_2px_0px_#111111] flex flex-col items-center justify-center overflow-hidden px-0.5"
                        >
                          {/* "Just booked" glow pulse */}
                          <motion.span
                            initial={{ opacity: 0.7, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.8 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="absolute inset-0 bg-success"
                          />
                          <span className="relative font-heading text-[10px] font-bold text-paper uppercase tracking-tighter leading-none truncate max-w-full">
                            {booked.name}
                          </span>
                          <span className="relative font-mono text-[7px] text-paper/80 uppercase tracking-widest leading-none mt-0.5 truncate max-w-full">
                            {booked.service}
                          </span>
                        </motion.div>
                      ) : isBusy ? (
                        <div className="absolute inset-0 bg-dark/10 border border-dark/15 flex items-center justify-center">
                          <span className="font-mono text-[7px] text-dark/35 uppercase tracking-widest">
                            Busy
                          </span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 border border-dashed border-dark/15" />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Footer status */}
        <div className="mt-3 flex items-center gap-2 border-t border-dark/10 pt-2">
          {booked ? (
            <p className="font-mono text-[9px] text-success uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-success" />
              Booked · {booked.day} · {booked.time}
            </p>
          ) : (
            <p className="font-mono text-[9px] text-dark/40 uppercase tracking-widest">
              Awaiting booking…
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
