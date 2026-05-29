import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QualifyAnswers } from '../lib/demoTypes';

interface QualifyFormProps {
  onQualified: (answers: QualifyAnswers) => void;
  submitLabel?: string;
}

const VOLUME_OPTIONS = ['Under 50', '50–200', '200–500', '500+'];
const GOAL_OPTIONS = [
  'Answering calls / receptionist',
  'Lead generation',
  'Follow-ups',
  'Not sure yet',
];
const TIMELINE_OPTIONS = ['ASAP', '1–3 months', 'Just exploring'];

// Micro-label above each field — matches the uppercase tracking-widest treatment
// used across ActiveCall / AgentActivity.
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-mono text-[10px] font-bold text-dark/60 uppercase tracking-widest mb-2">
    {children}
  </p>
);

// Button-group select. Tight, fast to tap, hard-bordered to match the brand.
const ButtonGroup: React.FC<{
  options: string[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = value === opt;
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-tight border border-dark transition-all ${
            active
              ? 'bg-dark text-paper shadow-[2px_2px_0px_#FF5A00]'
              : 'bg-paper text-dark/70 hover:bg-offwhite'
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

export const QualifyForm: React.FC<QualifyFormProps> = ({
  onQualified,
  submitLabel = 'See available times →',
}) => {
  const [business, setBusiness] = useState('');
  const [volume, setVolume] = useState('');
  const [goal, setGoal] = useState('');
  const [timeline, setTimeline] = useState('');
  const [touched, setTouched] = useState(false);

  const complete =
    business.trim().length > 0 &&
    volume.length > 0 &&
    goal.length > 0 &&
    timeline.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!complete) return;
    onQualified({
      business: business.trim(),
      volume,
      goal,
      timeline,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Business / industry */}
      <div>
        <FieldLabel>What's your business or industry?</FieldLabel>
        <input
          type="text"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          placeholder="e.g. Dental clinic, HVAC, law firm…"
          className="w-full px-3 py-2.5 bg-offwhite border border-dark font-sans text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:bg-paper focus:shadow-[2px_2px_0px_#111111] transition-all"
        />
        {touched && !business.trim() && (
          <p className="font-mono text-[9px] text-signal uppercase tracking-widest mt-1.5">
            Required
          </p>
        )}
      </div>

      {/* Volume */}
      <div>
        <FieldLabel>Roughly how many calls or leads a month?</FieldLabel>
        <ButtonGroup options={VOLUME_OPTIONS} value={volume} onChange={setVolume} />
        {touched && !volume && (
          <p className="font-mono text-[9px] text-signal uppercase tracking-widest mt-1.5">
            Pick one
          </p>
        )}
      </div>

      {/* Goal */}
      <div>
        <FieldLabel>What do you want to automate?</FieldLabel>
        <ButtonGroup options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
        {touched && !goal && (
          <p className="font-mono text-[9px] text-signal uppercase tracking-widest mt-1.5">
            Pick one
          </p>
        )}
      </div>

      {/* Timeline */}
      <div>
        <FieldLabel>When are you looking to start?</FieldLabel>
        <ButtonGroup options={TIMELINE_OPTIONS} value={timeline} onChange={setTimeline} />
        {touched && !timeline && (
          <p className="font-mono text-[9px] text-signal uppercase tracking-widest mt-1.5">
            Pick one
          </p>
        )}
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        className={`w-full px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-widest border border-dark transition-all ${
          complete
            ? 'bg-signal text-paper shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111111]'
            : 'bg-dark/10 text-dark/40 cursor-not-allowed'
        }`}
      >
        {submitLabel}
      </motion.button>
    </form>
  );
};
