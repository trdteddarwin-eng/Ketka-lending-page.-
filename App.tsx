import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { AppState, BusinessConfig, TranscriptItem } from './types';
import { GeminiLiveService } from './services/geminiLive';
import { AnimatePresence, motion } from 'framer-motion';
import { recordDemoStart, getRemainingCooldown, hasUsedDemoEmail, recordDemoEmail } from './utils/rateLimit';
import { AgentActivityEvent, BookedAppointment } from './lib/demoTypes';
import { submitLeadAndCheck } from './services/webhookService';

// Lazy-load heavy components that aren't needed on initial render
const SetupForm = lazy(() => import('./components/SetupForm').then(m => ({ default: m.SetupForm })));
const ActiveCall = lazy(() => import('./components/ActiveCall').then(m => ({ default: m.ActiveCall })));
const TranscriptSummary = lazy(() => import('./components/TranscriptSummary').then(m => ({ default: m.TranscriptSummary })));
const BookCallModal = lazy(() => import('./components/BookCallModal').then(m => ({ default: m.BookCallModal })));
const ChatWidget = lazy(() => import('./components/ChatWidget').then(m => ({ default: m.ChatWidget })));

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [activity, setActivity] = useState<AgentActivityEvent[]>([]);
  const [booked, setBooked] = useState<BookedAppointment | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookVariant, setBookVariant] = useState<'completed' | 'already-used'>('completed');

  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const callStartRef = useRef<number>(0);

  useEffect(() => {
    liveServiceRef.current = new GeminiLiveService();

    liveServiceRef.current.onTranscript = (newTranscript) => {
      setTranscript(newTranscript);
    };

    return () => {
      liveServiceRef.current?.disconnect();
    };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      const remaining = getRemainingCooldown();
      setCooldownRemaining(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleSetupComplete = async (newConfig: BusinessConfig) => {
    // Re-use lock: one voice demo per email. The Google Sheet (via the Apps
    // Script webhook) is the source of truth AND logs the lead in the same call;
    // localStorage is the instant first layer. If they've already used it, skip
    // the demo and push them to book a call.
    const emailKey = (newConfig.email || '').trim().toLowerCase();
    let blocked = emailKey ? hasUsedDemoEmail(emailKey) : false;
    if (!blocked && emailKey) {
      const result = await submitLeadAndCheck(newConfig);
      // result === null means we couldn't read the response (CORS/network) —
      // fall back to the localStorage layer rather than block a real lead.
      if (result && result.alreadyUsed) blocked = true;
    }
    if (blocked) {
      if (emailKey) recordDemoEmail(emailKey);
      setConfig(newConfig);
      setBookVariant('already-used');
      setShowBookModal(true);
      return;
    }
    if (emailKey) recordDemoEmail(emailKey);

    setConfig(newConfig);
    setAppState(AppState.CONNECTING);
    setErrorMsg(null);
    setTranscript([]);
    setIsReconnecting(false);
    setReconnectAttempt(0);
    setActivity([]);
    setBooked(null);

    try {
      if (liveServiceRef.current) {
        // Wire up session callbacks
        liveServiceRef.current.onTimeout = (info) => {
          if (info.warning) {
            // 4-min warning — tell the AI to wrap up naturally
            liveServiceRef.current?.sendText(
              "[SYSTEM] We're approaching the 5-minute mark. Please naturally wrap up the conversation. Say something like 'Well it was great chatting with you! Is there anything else I can help with before we hang up?'"
            );
          }
          if (info.disconnected) {
            // 5-min auto-disconnect — go to summary with calendar
            setCallDuration(300);
            setAppState(AppState.SUMMARY);
          }
        };

        liveServiceRef.current.onReconnecting = (attempt) => {
          setIsReconnecting(true);
          setReconnectAttempt(attempt);
        };

        liveServiceRef.current.onReconnectFailed = () => {
          setIsReconnecting(false);
          setErrorMsg("Connection lost. The call has ended.");
          setAppState(AppState.SUMMARY);
        };

        liveServiceRef.current.onConnectionQuality = (quality) => {
          console.log('Connection quality:', quality);
        };

        // Stream the AI's structured actions into the live activity feed.
        // Events fire 'running' then 'done' with the same id — merge in place.
        liveServiceRef.current.onActivity = (event) => {
          setActivity((prev) => {
            const idx = prev.findIndex((e) => e.id === event.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = event;
              return copy;
            }
            return [...prev, event];
          });
        };

        liveServiceRef.current.onAppointmentBooked = (appt) => {
          setBooked(appt);
        };

        // The AI hung up on its own (end_call tool). Let the closing line finish,
        // then tear down and surface the Book-a-Call CTA.
        liveServiceRef.current.onEndCallRequested = () => {
          window.setTimeout(() => {
            if (liveServiceRef.current) {
              setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
              liveServiceRef.current.disconnect();
            }
            setBookVariant('completed');
            setShowBookModal(true);
            setAppState(AppState.SUMMARY);
          }, 2800);
        };

        await liveServiceRef.current.connect(newConfig);
        setAppState(AppState.ACTIVE);
        recordDemoStart();
        callStartRef.current = Date.now();

        // Trigger the AI to speak first
        setTimeout(() => {
          liveServiceRef.current?.sendText("[SYSTEM] The caller has connected. Greet them now.");
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
      setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
      liveServiceRef.current.disconnect();
    }
    setBookVariant('completed');
    setShowBookModal(true);
    setAppState(AppState.SUMMARY);
  };

  const handleCloseSummary = () => {
    setAppState(AppState.IDLE);
    setConfig(null);
  };

  // Closing the Book-a-Call modal exits the demo overlay entirely. The used
  // email is already recorded, so re-submitting will hit the 'already-used' path.
  const closeBookModal = () => {
    setShowBookModal(false);
    setAppState(AppState.IDLE);
    setConfig(null);
    setBooked(null);
    setActivity([]);
  };

  useEffect(() => {
    (async function () {
      const { getCalApi } = await import("@calcom/embed-react");
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

  // The Book-a-Call modal can appear while appState is still IDLE (e.g. the
  // re-use 'already-used' block fired straight from the landing-page form).
  // Count it as "overlay visible" so the root container stays interactive —
  // otherwise the modal renders but pointer-events-none freezes it.
  const isOverlayVisible = appState !== AppState.IDLE || showBookModal;

  return (
    <div className={`fixed inset-0 z-[9999] overflow-y-auto font-sans transition-colors duration-300 ${isOverlayVisible ? 'bg-paper pointer-events-auto' : 'bg-transparent pointer-events-none'}`}>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-[10000] pointer-events-auto">
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      </div>

      {/* Header */}
      <header className={`p-4 md:p-6 flex items-center justify-between border-b border-dark/20 bg-offwhite/90 backdrop-blur-sm fixed top-0 w-full z-50 transition-opacity duration-300 ${isOverlayVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-dark rounded-none flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-paper" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-heading font-bold text-xl tracking-tighter text-dark uppercase">Reception<span className="text-signal italic pl-1">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 bg-dark/5 text-dark/70 border border-dark/10 hidden sm:block">
            Powered by Gemini 3.1
          </div>
          <button
            onClick={() => {
              if (liveServiceRef.current) {
                liveServiceRef.current.disconnect();
              }
              setAppState(AppState.IDLE);
              setConfig(null);
              setErrorMsg(null);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-none bg-paper hover:bg-signal text-dark hover:text-paper transition-all border border-dark group"
            title="Close demo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-20 pb-8 px-4 flex flex-col items-center min-h-screen relative transition-opacity duration-300 ${isOverlayVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
          {isOverlayVisible && <div className="hiw-noise opacity-50"></div>}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#11111105_1px,transparent_1px),linear-gradient(to_bottom,#11111105_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>

        <Suspense fallback={null}>
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-signal border border-dark text-paper max-w-md text-center font-mono text-xs uppercase tracking-widest z-10 pointer-events-auto"
            >
              {errorMsg}
              {cooldownRemaining > 0 && (
                <div className="mt-2 font-bold">{formatCooldown(cooldownRemaining)}</div>
              )}
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
              className="w-full z-10 flex flex-col items-center pointer-events-auto"
            >
              <ActiveCall
                config={config}
                service={liveServiceRef.current}
                onEndCall={handleEndCall}
                transcript={transcript}
                activity={activity}
                booked={booked}
                isReconnecting={isReconnecting}
                reconnectAttempt={reconnectAttempt}
              />
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
                callDuration={callDuration}
              />
              {/* Booking now happens through the qualify-gated Book-a-Call modal
                  (rendered below), so the calendar is no longer exposed un-gated. */}
            </motion.div>
          )}
        </AnimatePresence>
        </Suspense>
      </main>

      {/* Qualify-gated Book-a-Call popup — post-demo and re-use ('already-used') */}
      <Suspense fallback={null}>
        {showBookModal && (
          <BookCallModal
            open={showBookModal}
            variant={bookVariant}
            config={config}
            booked={booked}
            calLink="tedca-skill-nv7wuk/secret"
            calNamespace="30min"
            onClose={closeBookModal}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;
