import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audio-utils';
import { BusinessConfig, TranscriptItem } from '../types';
import { SYSTEM_INSTRUCTION_TEMPLATE, DEMO_TOOLS } from '../constants';
import type { AgentActivityEvent, BookedAppointment, DemoToolName } from '../lib/demoTypes';
import { getAvailableSlots, bookSlot } from '../lib/demoCalendar';

export type ConnectionQuality = 'good' | 'fair' | 'poor';

export class GeminiLiveService {
  private ai: GoogleGenAI | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private outputGainNode: GainNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private nextStartTime: number = 0;
  private audioSources: Set<AudioBufferSourceNode> = new Set();
  private isConnected: boolean = false;
  private sessionPromise: Promise<any> | null = null;
  private processingId: number = 0;

  // Monotonic counter for generating unique activity-event ids (avoids relying
  // on Math.random/Date.now for uniqueness within a session).
  private activityCounter: number = 0;

  // Transcription State
  private currentInputText: string = '';
  private currentOutputText: string = '';
  private transcript: TranscriptItem[] = [];

  // Session management
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private connectStartTime: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 2;
  private lastConfig: BusinessConfig | null = null;
  private lastMediaStream: MediaStream | null = null;

  // Connection quality tracking
  private lastAudioChunkTime: number = 0;
  private audioGapCounts: number[] = []; // timestamps of large gaps
  private currentQuality: ConnectionQuality = 'good';

  // Session limits (ms)
  private static readonly SESSION_MAX_MS = 5 * 60 * 1000; // 5 min
  private static readonly SESSION_WARNING_MS = 4 * 60 * 1000; // 4 min

  // Callbacks
  public onVolumeChange: ((volume: number) => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onTranscript: ((transcript: TranscriptItem[]) => void) | null = null;
  public onTimeout: ((info: { warning: boolean; disconnected: boolean }) => void) | null = null;
  public onReconnecting: ((attempt: number) => void) | null = null;
  public onReconnectFailed: (() => void) | null = null;
  public onConnectionQuality: ((quality: ConnectionQuality) => void) | null = null;
  // Fires for every step in the live "Agent Activity" feed (running -> done).
  public onActivity: ((event: AgentActivityEvent) => void) | null = null;
  // Fires once when an appointment is successfully booked, to fill the calendar.
  public onAppointmentBooked: ((appt: BookedAppointment) => void) | null = null;
  // Fires when the model decides the call is over (end_call tool). The consumer
  // should let any final audio play, then disconnect and show the post-call CTA.
  public onEndCallRequested: (() => void) | null = null;

  constructor() {
    // No key here. The Gemini client is created per-connection in
    // establishConnection() from a short-lived ephemeral token fetched from the
    // server — the browser never holds the real API key.
  }

  /**
   * Unlock + warm the audio pipeline. MUST be called synchronously from inside a
   * real user gesture (the tap that starts the demo) — BEFORE any `await`.
   *
   * iOS Safari is the reason this exists. On iOS, AudioContexts are created in
   * the 'suspended' state and can only be resumed from a user-gesture call stack.
   * Our connect flow does `await submitLeadAndCheck(...)` first, which consumes
   * the gesture; by the time establishConnection() creates the contexts, iOS
   * refuses to start them. The symptom is a call that looks "connected" but is
   * dead BOTH ways: the mic ScriptProcessor never fires (AI hears silence) and
   * TTS playback never starts (you hear nothing). Creating + resuming the
   * contexts here, in the gesture, flips iOS's audio switch on for the session.
   */
  unlockAudio() {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      if (!Ctx) return;
      if (!this.inputAudioContext) this.inputAudioContext = new Ctx({ sampleRate: 16000 });
      if (!this.outputAudioContext) this.outputAudioContext = new Ctx({ sampleRate: 24000 });
      // Resume must happen in the gesture stack on iOS.
      if (this.inputAudioContext.state === 'suspended') void this.inputAudioContext.resume();
      if (this.outputAudioContext.state === 'suspended') void this.outputAudioContext.resume();
      // Play a 1-frame silent buffer through the output to fully unlock iOS
      // playback (the canonical Web Audio "unlock" trick).
      const buf = this.outputAudioContext.createBuffer(1, 1, 22050);
      const src = this.outputAudioContext.createBufferSource();
      src.buffer = buf;
      src.connect(this.outputAudioContext.destination);
      src.start(0);
    } catch (e) {
      console.warn('[GeminiLive] unlockAudio failed (non-fatal):', e);
    }
  }

  async connect(config: BusinessConfig) {
    if (this.isConnected) return;

    this.lastConfig = config;
    this.transcript = [];
    this.currentInputText = '';
    this.currentOutputText = '';
    this.processingId = 0;
    this.reconnectAttempts = 0;
    this.activityCounter = 0;
    this.audioGapCounts = [];
    this.currentQuality = 'good';
    this.lastAudioChunkTime = 0;

    await this.establishConnection(config);
  }

  private async establishConnection(config: BusinessConfig) {
    try {
      // Initialize Audio Contexts — REUSE the ones unlockAudio() already created
      // inside the user gesture. Creating fresh ones here (post-`await`) would be
      // born suspended on iOS and never start. Only create if missing (e.g. a
      // reconnect after cleanup).
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      if (!this.inputAudioContext) this.inputAudioContext = new Ctx({ sampleRate: 16000 });
      if (!this.outputAudioContext) this.outputAudioContext = new Ctx({ sampleRate: 24000 });
      // Belt-and-suspenders: make sure both are running. On iOS these succeed
      // because unlockAudio() already activated the audio session in the gesture.
      if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
      if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

      // Output setup
      this.outputGainNode = this.outputAudioContext.createGain();
      this.analyzer = this.outputAudioContext.createAnalyser();
      this.analyzer.fftSize = 256;
      this.outputGainNode.connect(this.analyzer);
      this.analyzer.connect(this.outputAudioContext.destination);

      // Input setup (Microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });
      this.lastMediaStream = stream;

      // Start Analysis Loop
      this.startAnalysisLoop();

      // Fetch a short-lived, single-use EPHEMERAL token from our server. The
      // browser never holds the real key — only this disposable token (valid a
      // few minutes, one session). Ephemeral tokens require the v1alpha endpoint.
      const tokenRes = await fetch('/api/gemini-token', { method: 'POST' });
      if (!tokenRes.ok) throw new Error('Failed to obtain Live session token');
      const tokenData = await tokenRes.json();
      if (!tokenData || !tokenData.token) throw new Error('No Live session token returned');
      const ai = new GoogleGenAI({
        apiKey: tokenData.token,
        httpOptions: { apiVersion: 'v1alpha' },
      });
      this.ai = ai;

      // Connect to Gemini Live with the ephemeral token.
      // gemini-3.1-flash-live-preview (Mar 2026) — Google's lowest-latency Live
      // model, built for real-time voice + tool calling.
      this.sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION_TEMPLATE(config),
          tools: [{ functionDeclarations: DEMO_TOOLS }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connection Opened');
            // iOS can re-suspend the context once getUserMedia grabs the mic —
            // nudge both back to running so playback + capture actually flow.
            void this.inputAudioContext?.resume();
            void this.outputAudioContext?.resume();
            this.setupInputProcessing(stream);
            this.startSessionTimers();
          },
          onmessage: this.handleMessage.bind(this),
          onclose: (e: any) => {
            // Surface WHY the socket closed — the close code + reason tell us if
            // it's a rate limit, a bad frame, a server error, model issue, etc.
            console.warn(
              '[GeminiLive] Connection CLOSED →',
              'code:', e?.code,
              'reason:', e?.reason || '(none)',
              'wasClean:', e?.wasClean,
              e
            );
            this.handleConnectionLoss();
          },
          onerror: (e: any) => {
            console.error(
              '[GeminiLive] Connection ERROR →',
              'message:', e?.message,
              'code:', e?.code,
              e
            );
            this.handleConnectionLoss();
          }
        }
      });

      this.isConnected = true;
      this.connectStartTime = Date.now();
    } catch (error) {
      console.error('Failed to connect:', error);
      this.cleanup();
      throw error;
    }
  }

  private startSessionTimers() {
    this.clearSessionTimers();

    // 4-min warning
    this.warningTimer = setTimeout(() => {
      if (this.onTimeout) {
        this.onTimeout({ warning: true, disconnected: false });
      }
    }, GeminiLiveService.SESSION_WARNING_MS);

    // 5-min hard cutoff
    this.sessionTimer = setTimeout(() => {
      if (this.onTimeout) {
        this.onTimeout({ warning: false, disconnected: true });
      }
      this.disconnect();
    }, GeminiLiveService.SESSION_MAX_MS);
  }

  private clearSessionTimers() {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  private async handleConnectionLoss() {
    if (!this.isConnected) return;

    this.cleanupAudio();

    if (this.reconnectAttempts < this.maxReconnectAttempts && this.lastConfig) {
      this.reconnectAttempts++;
      if (this.onReconnecting) {
        this.onReconnecting(this.reconnectAttempts);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        await this.establishConnection(this.lastConfig);
      } catch (e) {
        console.error('Reconnect attempt failed:', e);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          if (this.onReconnectFailed) {
            this.onReconnectFailed();
          }
          this.cleanup();
        } else {
          this.handleConnectionLoss();
        }
      }
    } else {
      if (this.reconnectAttempts >= this.maxReconnectAttempts && this.onReconnectFailed) {
        this.onReconnectFailed();
      }
      this.cleanup();
    }
  }

  getConnectionQuality(): ConnectionQuality {
    return this.currentQuality;
  }

  getSessionDuration(): number {
    if (!this.connectStartTime) return 0;
    return Math.floor((Date.now() - this.connectStartTime) / 1000);
  }

  private updateConnectionQuality() {
    const now = Date.now();
    // Keep only gaps from the last 30 seconds
    const recentGaps = this.audioGapCounts.filter(t => now - t < 30000);
    this.audioGapCounts = recentGaps;

    let newQuality: ConnectionQuality;
    if (recentGaps.length >= 5) {
      newQuality = 'poor';
    } else if (recentGaps.length >= 2) {
      newQuality = 'fair';
    } else {
      newQuality = 'good';
    }

    if (newQuality !== this.currentQuality) {
      this.currentQuality = newQuality;
      if (this.onConnectionQuality) {
        this.onConnectionQuality(newQuality);
      }
    }
  }

  async sendText(text: string) {
    if (!this.sessionPromise) return;

    // sendText is used only for hidden SYSTEM nudges (the greeting trigger and
    // the wrap-up message), so we deliberately do NOT push it to the visible
    // transcript — otherwise the caller would see "[SYSTEM] ..." as their own line.
    try {
      const session = await this.sessionPromise;
      // Current @google/genai Live API: text turns go through sendClientContent.
      // The old session.send(content, turnComplete) was REMOVED — calling it threw
      // "session.send is not a function" and destabilized the live session.
      session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true,
      });
    } catch (e) {
      console.error('[GeminiLive] sendText failed (non-fatal):', e);
    }
  }

  private setupInputProcessing(stream: MediaStream) {
    if (!this.inputAudioContext) return;

    // iOS: ensure the input context is running, or onaudioprocess never fires
    // and the model receives pure silence (it never responds).
    if (this.inputAudioContext.state === 'suspended') void this.inputAudioContext.resume();

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected || !this.sessionPromise) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);

      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({ audio: pcmBlob });
      });
    };

    this.inputSource.connect(this.scriptProcessor);

    const muteGain = this.inputAudioContext.createGain();
    muteGain.gain.value = 0;
    this.scriptProcessor.connect(muteGain);
    muteGain.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle structured tool calls from the model. Wrapped so a tool error can
    // never bubble up and kill the audio session.
    if (message.toolCall?.functionCalls?.length) {
      try {
        this.handleToolCall(message.toolCall.functionCalls);
      } catch (e) {
        console.error('Error handling tool call', e);
      }
    }

    const serverContent = message.serverContent;

    // Handle Transcription
    if (serverContent?.inputTranscription) {
      this.currentInputText += serverContent.inputTranscription.text;
    }
    if (serverContent?.outputTranscription) {
      this.currentOutputText += serverContent.outputTranscription.text;
    }

    if (serverContent?.turnComplete) {
      this.commitTranscript();
    }

    if (serverContent?.interrupted) {
      console.log('User Interrupted!');
      this.processingId++;
      this.commitTranscript();
      this.stopAllAudio();
      return;
    }

    const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      // Track audio gaps for connection quality
      const now = Date.now();
      if (this.lastAudioChunkTime > 0) {
        const gap = now - this.lastAudioChunkTime;
        if (gap > 2000) {
          this.audioGapCounts.push(now);
          this.updateConnectionQuality();
        }
      }
      this.lastAudioChunkTime = now;

      if (!this.outputAudioContext || !this.outputGainNode) {
        console.warn('Audio received but output context/gain not ready');
        return;
      }

      if (this.outputAudioContext.state === 'suspended') {
        console.log('Resuming suspended output audio context');
        await this.outputAudioContext.resume();
      }

      try {
        const currentId = this.processingId;
        const uint8Array = base64ToUint8Array(base64Audio);
        console.log(`Received audio chunk: ${uint8Array.byteLength} bytes`);

        const audioBuffer = await decodeAudioData(uint8Array, this.outputAudioContext);
        console.log(`Decoded audio: ${audioBuffer.duration}s`);

        if (currentId !== this.processingId) {
          console.log('Discarding audio chunk due to interruption');
          return;
        }

        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputGainNode);

        const ctxNow = this.outputAudioContext.currentTime;
        if (this.nextStartTime < ctxNow) {
          this.nextStartTime = ctxNow;
        }

        console.log(`Scheduling audio at ${this.nextStartTime} (current: ${ctxNow})`);
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;

        this.audioSources.add(source);
        source.onended = () => {
          this.audioSources.delete(source);
        };
      } catch (e) {
        console.error('Error decoding audio chunk', e);
      }
    }
  }

  /**
   * Process one or more function calls emitted by the model during the live
   * call. For each call we: (1) emit a 'running' activity event, (2) run the
   * simulated handler, (3) emit a 'done' event, and (4) send the tool result
   * back to the model so it keeps talking. Every step is defensive — a single
   * bad tool call must never break the audio session.
   */
  private handleToolCall(functionCalls: any[]) {
    const functionResponses: any[] = [];

    for (const call of functionCalls) {
      const name = (call?.name || '') as DemoToolName | '';
      const args = (call?.args || {}) as Record<string, any>;
      const id = call?.id;

      let response: Record<string, unknown> = { status: 'ok' };

      try {
        switch (name) {
          case 'check_availability': {
            this.emitActivity(name, 'running', 'Checking calendar availability…');
            const slots = getAvailableSlots(
              typeof args.preferred_day === 'string' ? args.preferred_day : undefined
            );
            response = { status: 'ok', slots };
            this.emitActivity(name, 'done', `Found ${slots.length} open slots`, slots.join(', '));
            break;
          }
          case 'book_appointment': {
            const day = typeof args.day === 'string' ? args.day : '';
            const time = typeof args.time === 'string' ? args.time : '';
            const service = typeof args.service === 'string' ? args.service : undefined;
            this.emitActivity(
              name,
              'running',
              `Booking ${day || 'appointment'}${time ? ` at ${time}` : ''}`
            );
            const appt = bookSlot({ day, time, service });
            response = {
              status: 'booked',
              day: appt.day,
              time: appt.time,
              service: appt.service,
            };
            if (this.onAppointmentBooked) {
              try {
                this.onAppointmentBooked(appt);
              } catch (e) {
                console.error('onAppointmentBooked callback error', e);
              }
            }
            this.emitActivity(
              name,
              'done',
              `Confirmed for ${appt.day} ${appt.time}`,
              appt.service
            );
            break;
          }
          case 'capture_lead': {
            this.emitActivity(name, 'running', 'Saving caller details…');
            const captured = {
              name: typeof args.name === 'string' ? args.name : undefined,
              phone: typeof args.phone === 'string' ? args.phone : undefined,
              reason: typeof args.reason === 'string' ? args.reason : undefined,
            };
            response = { status: 'saved', ...captured };
            const summary = [captured.name, captured.phone].filter(Boolean).join(' · ');
            this.emitActivity(name, 'done', 'Saved', summary || undefined);
            break;
          }
          case 'take_message': {
            this.emitActivity(name, 'running', 'Taking a message for Dr. Martinez…');
            const msg = typeof args.message === 'string' ? args.message : '';
            response = { status: 'noted', message: msg };
            this.emitActivity(name, 'done', 'Message noted', msg || undefined);
            break;
          }
          case 'end_call': {
            this.emitActivity(name, 'done', 'Call complete', 'Wrapping up…');
            response = { status: 'ending' };
            // Defer to the consumer (App) to let the closing audio finish before
            // we actually tear down the session and show the post-call CTA.
            if (this.onEndCallRequested) {
              try {
                this.onEndCallRequested();
              } catch (e) {
                console.error('onEndCallRequested callback error', e);
              }
            }
            break;
          }
          default: {
            // Unknown tool — return a generic success so the model isn't stuck.
            response = { status: 'ok' };
            break;
          }
        }
      } catch (e) {
        console.error(`Error running tool "${name}"`, e);
        // Even on failure the simulated calendar "succeeds" so the demo never
        // stalls; the model gets a generic ok and keeps the conversation going.
        response = { status: 'ok' };
      }

      functionResponses.push({ id, name: call?.name, response });
    }

    // Send the tool results back so the model continues the turn (and speaks
    // the confirmation). Fire-and-forget; never throw out of here.
    if (functionResponses.length && this.sessionPromise) {
      this.sessionPromise
        .then((session) => {
          try {
            session.sendToolResponse({ functionResponses });
          } catch (e) {
            console.error('Error sending tool response', e);
          }
        })
        .catch((e) => console.error('Session unavailable for tool response', e));
    }
  }

  /** Emit a single Agent Activity feed event via the onActivity callback. */
  private emitActivity(
    tool: DemoToolName | '',
    status: 'running' | 'done',
    label: string,
    detail?: string
  ) {
    if (!this.onActivity || !tool) return;
    this.activityCounter++;
    const event: AgentActivityEvent = {
      id: `act-${this.activityCounter}`,
      tool: tool as DemoToolName,
      status,
      label,
      detail,
      timestamp: Date.now(),
    };
    try {
      this.onActivity(event);
    } catch (e) {
      console.error('onActivity callback error', e);
    }
  }

  private commitTranscript() {
    let changed = false;
    if (this.currentInputText.trim()) {
      this.transcript.push({ role: 'user', text: this.currentInputText.trim(), timestamp: new Date() });
      this.currentInputText = '';
      changed = true;
    }
    if (this.currentOutputText.trim()) {
      this.transcript.push({ role: 'model', text: this.currentOutputText.trim(), timestamp: new Date() });
      this.currentOutputText = '';
      changed = true;
    }

    if (changed && this.onTranscript) {
      this.onTranscript([...this.transcript]);
    }
  }

  private stopAllAudio() {
    this.audioSources.forEach(source => {
      try {
        source.stop();
      } catch (e) { }
    });
    this.audioSources.clear();

    if (this.outputAudioContext) {
      this.nextStartTime = this.outputAudioContext.currentTime;
    }
  }

  private startAnalysisLoop() {
    const updateVolume = () => {
      if (!this.isConnected) return;

      if (this.analyzer) {
        const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
        this.analyzer.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const vol = Math.min(1, average / 128);

        if (this.onVolumeChange) {
          this.onVolumeChange(vol);
        }
      }
      requestAnimationFrame(updateVolume);
    };
    updateVolume();
  }

  async disconnect() {
    this.isConnected = false;
    this.cleanup();
  }

  private cleanupAudio() {
    this.stopAllAudio();

    if (this.inputSource) this.inputSource.disconnect();
    if (this.scriptProcessor) this.scriptProcessor.disconnect();
    if (this.outputGainNode) this.outputGainNode.disconnect();
    if (this.analyzer) this.analyzer.disconnect();

    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();

    this.inputSource = null;
    this.scriptProcessor = null;
    this.outputGainNode = null;
    this.analyzer = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
  }

  private cleanup() {
    this.isConnected = false;
    this.clearSessionTimers();
    this.cleanupAudio();
    this.sessionPromise = null;

    if (this.lastMediaStream) {
      this.lastMediaStream.getTracks().forEach(t => t.stop());
      this.lastMediaStream = null;
    }

    if (this.onDisconnect) this.onDisconnect();
  }
}
