// Shared contract between the Gemini Live "engine" (which emits structured
// tool calls during the voice demo) and the demo UI (which visualizes them).
//
// Both the engine (services/geminiLive.ts) and the UI components
// (components/AgentActivity.tsx, components/LiveCalendar.tsx) import from here so
// they stay in lockstep. Keep this file dependency-free.

export type DemoToolName =
  | 'check_availability'
  | 'book_appointment'
  | 'capture_lead'
  | 'take_message'
  | 'end_call';

/** Answers from the pre-booking qualification gate. */
export interface QualifyAnswers {
  /** Their business / industry */
  business: string;
  /** Rough monthly call/lead volume (or revenue range) */
  volume: string;
  /** What they want to automate */
  goal: string;
  /** When they want to start */
  timeline: string;
}

/** A single step in the live "Agent Activity" feed. */
export interface AgentActivityEvent {
  id: string;
  tool: DemoToolName;
  status: 'running' | 'done';
  /** Human-readable step, e.g. "Booking Tuesday at 2:00 PM" */
  label: string;
  /** Optional sub-line, e.g. "Confirmation sent to alex@email.com" */
  detail?: string;
  timestamp: number;
}

/** A confirmed appointment, used to fill the live calendar slot. */
export interface BookedAppointment {
  /** e.g. "Tuesday, Jun 3" */
  day: string;
  /** e.g. "2:00 PM" */
  time: string;
  /** e.g. "Cleaning" */
  service: string;
  /** Caller's first name */
  name: string;
}

/** Structured lead info captured mid-conversation. */
export interface CapturedLead {
  name?: string;
  phone?: string;
  reason?: string;
}
