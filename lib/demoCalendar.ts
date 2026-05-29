// Deterministic simulated calendar sandbox for the Gemini Live voice demo.
//
// There is NO real calendar API here — every operation always succeeds. The
// point is to give the model concrete, plausible data to confirm verbally and
// to give the UI structured results to visualize. Keep this file pure and
// dependency-free aside from the shared types.

import type { BookedAppointment } from './demoTypes';

// A rotating pool of plausible open slots. We rotate deterministically with a
// module-level counter so repeated calls look "live" without using Math.random
// or Date.now (which would make the demo non-deterministic).
const SLOT_POOL: string[] = [
  'Tuesday 2:00 PM',
  'Wednesday 10:30 AM',
  'Friday 4:00 PM',
  'Monday 9:00 AM',
  'Thursday 1:15 PM',
  'Saturday 11:00 AM',
];

let availabilityCounter = 0;

/**
 * Return 3 plausible, human-readable open appointment slots.
 *
 * If the caller mentions a preferred day, we surface a slot on that day first
 * so the model has something natural to offer. Otherwise we rotate through the
 * pool deterministically.
 */
export function getAvailableSlots(preferredDay?: string): string[] {
  const slots: string[] = [];

  // If a preferred day was given, lead with a matching slot when we have one.
  if (preferredDay && preferredDay.trim()) {
    const day = preferredDay.trim().toLowerCase();
    const match = SLOT_POOL.find((s) => s.toLowerCase().startsWith(day));
    if (match) {
      slots.push(match);
    }
  }

  // Fill the remainder by rotating through the pool, skipping anything we have
  // already added, until we have 3 distinct slots.
  let i = 0;
  while (slots.length < 3 && i < SLOT_POOL.length * 2) {
    const candidate = SLOT_POOL[(availabilityCounter + i) % SLOT_POOL.length];
    if (!slots.includes(candidate)) {
      slots.push(candidate);
    }
    i++;
  }

  // Advance the rotation so the next call offers a slightly different set.
  availabilityCounter = (availabilityCounter + 1) % SLOT_POOL.length;

  return slots.slice(0, 3);
}

interface BookSlotArgs {
  day?: string;
  time?: string;
  service?: string;
  name?: string;
}

/**
 * Normalize a booking request into a BookedAppointment. Always succeeds —
 * missing fields fall back to sensible defaults so the UI always has a
 * complete, displayable appointment.
 */
export function bookSlot(args: BookSlotArgs = {}): BookedAppointment {
  const fallbackSlot = getAvailableSlots(args.day)[0] || 'Tuesday 2:00 PM';
  const [fallbackDay, ...fallbackTimeParts] = fallbackSlot.split(' ');
  const fallbackTime = fallbackTimeParts.join(' ') || '2:00 PM';

  const day = (args.day && args.day.trim()) || fallbackDay;
  const time = (args.time && args.time.trim()) || fallbackTime;
  const service = (args.service && args.service.trim()) || 'Cleaning';
  const name = (args.name && args.name.trim()) || 'Guest';

  return { day, time, service, name };
}
