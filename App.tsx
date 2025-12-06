import React, { useState, useRef, useEffect } from 'react';
import { AppState, BusinessConfig, TranscriptItem } from './types';
import { GeminiLiveService } from './services/geminiLive';
import { SetupForm } from './components/SetupForm';
import { ActiveCall } from './components/ActiveCall';
import { TranscriptSummary } from './components/TranscriptSummary';
import { AnimatePresence, motion } from 'framer-motion';
import Cal, { getCalApi } from "@calcom/embed-react";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  // Use ref to keep the service singleton across renders
  const liveServiceRef = useRef<GeminiLiveService | null>(null);

  useEffect(() => {
    liveServiceRef.current = new GeminiLiveService();

    // Bind the transcript callback
    liveServiceRef.current.onTranscript = (newTranscript) => {
      setTranscript(newTranscript);
    };

    return () => {
      liveServiceRef.current?.disconnect();
    };
  }, []);

  const handleSetupComplete = async (newConfig: BusinessConfig) => {
    setConfig(newConfig);
    setAppState(AppState.CONNECTING);
    setErrorMsg(null);
    setTranscript([]); // Reset transcript for new call

    try {
      if (liveServiceRef.current) {
        await liveServiceRef.current.connect(newConfig);
        setAppState(AppState.ACTIVE);

        // Trigger the AI to speak first
        setTimeout(() => {
          liveServiceRef.current?.sendText("The user has connected. Please greet them now.");
        }, 100);
      }
    } catch (e) {
      console.error(e);
      setAppState(AppState.SETUP);
      setErrorMsg("Failed to access microphone or connect to AI service. Please check permissions and try again.");
    }
  };

  const handleEndCall = () => {
    if (liveServiceRef.current) {
      liveServiceRef.current.disconnect();
    }
    // Transition to Summary instead of Setup
    setAppState(AppState.SUMMARY);
  };

  const handleCloseSummary = () => {
    setAppState(AppState.IDLE);
    setConfig(null);
  };

  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ "namespace": "30min" });
      cal("ui", { "styles": { "branding": { "brandColor": "#7d3131" } }, "hideEventTypeDetails": false, "layout": "month_view" });
    })();
  }, []);

  useEffect(() => {
    const handleStartDemo = (event: CustomEvent<BusinessConfig | null>) => {
      const newConfig = event.detail;
      if (newConfig) {
        handleSetupComplete(newConfig);
      } else {
        setAppState(AppState.SETUP);
      }
    };

    window.addEventListener('start-demo', handleStartDemo as EventListener);
    return () => {
      window.removeEventListener('start-demo', handleStartDemo as EventListener);
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[9999] bg-white text-slate-900 selection:bg-green-500/30 overflow-y-auto font-sans ${appState === AppState.IDLE ? 'hidden' : ''}`}>

      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-gray-100 backdrop-blur-sm fixed top-0 w-full z-50 bg-white/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg shadow-black/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-black">Reception<span className="text-green-600">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-500 border border-gray-200">
            Powered by Gemini 2.5
          </div>
          {/* Close button to go back to landing page */}
          <button
            onClick={() => {
              if (liveServiceRef.current) {
                liveServiceRef.current.disconnect();
              }
              setAppState(AppState.IDLE);
              setConfig(null);
              setErrorMsg(null);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors border border-gray-200"
            title="Close demo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 flex flex-col items-center min-h-screen relative overflow-y-auto">

        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-green-500/5 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]"
          />
        </div>

        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 max-w-md text-center text-sm z-10 pointer-events-auto"
            >
              {errorMsg}
            </motion.div>
          )}

          {appState === AppState.SETUP && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-xl z-10 pointer-events-auto my-8"
            >
              <SetupForm onComplete={handleSetupComplete} isLoading={false} />
            </motion.div>
          )}

          {appState === AppState.CONNECTING && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-xl z-10 pointer-events-auto"
            >
              <SetupForm onComplete={() => { }} isLoading={true} />
            </motion.div>
          )}

          {appState === AppState.ACTIVE && config && liveServiceRef.current && (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="w-full z-10 flex flex-col items-center gap-8 pointer-events-auto"
            >
              <ActiveCall
                config={config}
                service={liveServiceRef.current}
                onEndCall={handleEndCall}
              />

              <div className="w-full max-w-4xl h-[600px] bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-700">
                <Cal
                  namespace="30min"
                  calLink="ted-charles-enqyjn/30min"
                  style={{ width: "100%", height: "100%", overflow: "scroll" }}
                  config={{ layout: "month_view" }}
                />
              </div>
            </motion.div>
          )}

          {appState === AppState.SUMMARY && config && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
              className="w-full z-10 pointer-events-auto"
            >
              <TranscriptSummary
                transcript={transcript}
                config={config}
                onClose={handleCloseSummary}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Embed - Only show when NOT in ACTIVE state to avoid duplication if desired, or keep it. 
            The user said "duplicate that", so having it twice might be what they want, or maybe they want it visible during the demo.
            If I keep it here, it will be at the bottom.
            If I put it in ACTIVE state, it will be in the middle.
            I'll keep this one here as it acts as a footer for the app.
        */}
        {appState !== AppState.ACTIVE && appState !== AppState.IDLE && (
          <div className="w-full max-w-4xl mt-12 z-10 pointer-events-auto">
            <Cal
              namespace="30min"
              calLink="ted-charles-enqyjn/30min"
              style={{ width: "100%", height: "100%", overflow: "scroll" }}
              config={{ layout: "month_view" }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
