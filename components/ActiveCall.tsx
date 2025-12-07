import React, { useEffect, useState } from 'react';
import { BusinessConfig } from '../types';
import { Visualizer } from './Visualizer';
import { GeminiLiveService } from '../services/geminiLive';
import { motion } from 'framer-motion';

interface ActiveCallProps {
  config: BusinessConfig;
  onEndCall: () => void;
  service: GeminiLiveService;
}

export const ActiveCall: React.FC<ActiveCallProps> = ({ config, onEndCall, service }) => {
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center w-full h-full px-4 py-6"
    >
      {/* Minimal Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold tracking-wider mb-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
          LIVE
        </div>
        <p className="text-slate-500 text-xs">{config.businessName}</p>
      </div>

      {/* Compact Visualizer */}
      <div className="relative w-[140px] h-[140px] md:w-[200px] md:h-[200px] flex items-center justify-center mb-4">
        <Visualizer isActive={true} volume={volume} />
      </div>

      {/* Timer */}
      <p className="text-slate-800 font-mono text-2xl md:text-3xl font-light mb-6">{formatTime(duration)}</p>

      {/* Speaking indicator */}
      <p className="text-xs text-slate-400 mb-6">Speaking with {config.firstName}</p>

      {/* End Call Button - Minimalistic */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onEndCall}
        className="w-14 h-14 md:w-16 md:h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      </motion.button>

      <p className="text-[10px] text-slate-400 mt-3">Tap to end call</p>

      {/* Tip - very subtle */}
      <div className="mt-8 px-4 py-2 bg-slate-50 rounded-lg max-w-xs text-center">
        <p className="text-[10px] text-slate-500">
          Try: "Book an appointment" or "What are your prices?"
        </p>
      </div>
    </motion.div>
  );
};
