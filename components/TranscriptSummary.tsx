import React, { useEffect, useState, useRef } from 'react';
import { TranscriptItem, BusinessConfig } from '../types';
import { WEBHOOK_URL } from '../constants';

interface TranscriptSummaryProps {
  transcript: TranscriptItem[];
  config: BusinessConfig;
  onClose: () => void;
}

export const TranscriptSummary: React.FC<TranscriptSummaryProps> = ({ transcript, config, onClose }) => {
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const hasAttemptedSend = useRef(false);

  useEffect(() => {
    if (WEBHOOK_URL && transcript.length > 0 && !hasAttemptedSend.current) {
      sendWebhook();
    }
  }, [transcript]);

  const sendWebhook = async () => {
    if (!WEBHOOK_URL) return;

    hasAttemptedSend.current = true;
    setWebhookStatus('sending');

    try {
      const payload = {
        type: 'TRANSCRIPT_SUMMARY',
        timestamp: new Date().toISOString(),
        businessName: config.businessName,
        customerName: config.userName || `${config.firstName} ${config.lastName}`,
        phone: config.phone,
        email: config.email,
        industry: config.industry,
        services: config.services,
        avgTicketValue: config.avgTicketValue,
        transcript: transcript.map(item => `${item.role === 'user' ? 'Customer' : 'AI'}: ${item.text}`).join('\n'),
        summary: "Conversation from AI Receptionist Demo"
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setWebhookStatus('success');
      } else {
        console.error("Webhook failed with status:", response.status);
        setWebhookStatus('error');
      }
    } catch (error) {
      console.error("Webhook error:", error);
      setWebhookStatus('error');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in p-4">
      <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Call Transcript</h2>
            <p className="text-sm text-slate-500">Summary of conversation with {config.firstName} {config.lastName}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            Close Transcript
          </button>
        </div>

        {/* Webhook Status Bar */}
        {WEBHOOK_URL && (
          <div className={`px-6 py-2 text-xs font-medium flex items-center justify-between ${webhookStatus === 'success' ? 'bg-green-50 text-green-600' :
            webhookStatus === 'error' ? 'bg-red-50 text-red-600' :
              'bg-blue-50 text-blue-600'
            }`}>
            <div className="flex items-center gap-2">
              {webhookStatus === 'sending' && <div className="w-2 h-2 bg-current rounded-full animate-ping"></div>}
              {webhookStatus === 'success' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              {webhookStatus === 'error' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}

              <span>
                {webhookStatus === 'idle' && "Ready to sync..."}
                {webhookStatus === 'sending' && "Syncing conversation data..."}
                {webhookStatus === 'success' && "Conversation data successfully synced"}
                {webhookStatus === 'error' && "Failed to sync data"}
              </span>
            </div>
            {webhookStatus === 'error' && (
              <button onClick={() => sendWebhook()} className="underline hover:text-red-800">Retry</button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {transcript.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No conversation recorded.</p>
            </div>
          ) : (
            transcript.map((item, index) => (
              <div
                key={index}
                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${item.role === 'user'
                    ? 'bg-black text-white rounded-tr-none shadow-lg shadow-black/10'
                    : 'bg-gray-100 text-slate-800 rounded-tl-none'
                    }`}
                >
                  <div className="text-xs opacity-50 mb-1 font-medium uppercase tracking-wider">
                    {item.role === 'user' ? 'Customer' : 'AI Receptionist'}
                  </div>
                  <p className="leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Call to action */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Revenue Opportunity</h3>
              <p className="text-sm text-slate-600 mt-1">
                This transcript demonstrates how the AI captured information automatically.
                Missed calls like this cost {config.businessName} an estimated <span className="text-slate-900 font-bold">${config.avgTicketValue}</span> per occurrence.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};