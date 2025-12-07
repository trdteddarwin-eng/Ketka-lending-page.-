import React, { useEffect, useState } from 'react';
import { BusinessConfig } from '../types';
import { Visualizer } from './Visualizer';
import { GeminiLiveService } from '../services/geminiLive';
import { motion } from 'framer-motion';
import Cal, { getCalApi } from "@calcom/embed-react";

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

    // Simple timer for call duration
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      service.onVolumeChange = null;
    };
  }, [service]);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ "namespace": "30min" });
      cal("ui", { "styles": { "branding": { "brandColor": "#7d3131" } }, "hideEventTypeDetails": false, "layout": "month_view" });
    })();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl mx-auto gap-4 lg:gap-6 p-2 lg:p-4"
    >
      {/* Left Side: Visualizer and Controls */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2">
        <div className="text-center mb-4 lg:mb-6 space-y-2">
          <div className="inline-flex items-center px-2 py-0.5 lg:px-3 lg:py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] lg:text-xs font-semibold tracking-wider animate-pulse">
            LIVE DEMO
          </div>
          <h2 className="text-lg lg:text-2xl font-semibold text-slate-900">{config.businessName} AI Receptionist</h2>
          <p className="text-slate-500 text-xs lg:text-sm">Speaking with {config.firstName} {config.lastName}</p>
          <p className="text-slate-400 font-mono text-xs lg:text-sm mt-1 lg:mt-2">{formatTime(duration)}</p>
        </div>

        {/* Smaller visualizer on mobile - Optimized for iPhone */}
        <div className="relative w-full max-w-[180px] lg:max-w-[350px] aspect-square flex items-center justify-center mb-4 lg:mb-6">
          <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full"></div>
          <Visualizer isActive={true} volume={volume} />
        </div>

        <div className="flex gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEndCall}
            className="group flex items-center gap-2 lg:gap-3 px-5 py-2.5 lg:px-8 lg:py-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-full transition-all border-2 border-red-100 hover:border-red-600 shadow-lg shadow-red-500/10"
          >
            <div className="p-1 bg-current rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-5 lg:w-5 text-white group-hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-xs lg:text-base">End Call</span>
          </motion.button>
        </div>

        <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-lg text-center shadow-sm">
          <p className="text-[10px] lg:text-sm text-slate-600">
            <span className="text-green-600 font-semibold">Tip:</span> Try asking "Do you have any openings tomorrow afternoon?" or "What are your prices?"
          </p>
        </div>
      </div>

      {/* Right Side: Inline Calendar - Compact mobile sizing */}
      <div className="w-full lg:w-1/2 h-[350px] lg:h-[550px] bg-white rounded-xl lg:rounded-2xl overflow-hidden border border-gray-200 shadow-xl lg:shadow-2xl relative flex flex-col mt-2 lg:mt-0">
        <div className="p-2 lg:p-4 bg-gray-50 border-b border-gray-200 text-center">
          <h3 className="font-semibold text-slate-900 text-xs lg:text-base">Ready to move forward?</h3>
          <p className="text-[10px] lg:text-xs text-slate-500">Book a time below to get started.</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            src="https://cal.com/ted-charles-enqyjn/30min"
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Book a meeting"
          />
        </div>
      </div>
    </motion.div>
  );
};
