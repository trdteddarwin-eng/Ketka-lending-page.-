import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { mintLiveToken, generateChatReply } from './lib/geminiServer.js';

// Read a JSON body off a raw Node request (dev middleware only).
function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c: any) => { raw += c; });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Server-side key for the DEV middleware only. Captured in this closure and
  // used to answer /api/* during `npm run dev` — it is NEVER added to `define`,
  // so it is never inlined into client code.
  const GEMINI_API_KEY = env.GEMINI_API_KEY || '';
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [
      {
        name: 'blog-rewrite',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/blog' || req.url === '/blog/') {
              req.url = '/blog/index.html';
            } else if (req.url === '/blog/dental-ai-receptionist-case-study') {
              req.url = '/blog/dental-ai-receptionist-case-study.html';
            } else if (req.url === '/blog/ai-follow-up-emails-case-study') {
              req.url = '/blog/ai-follow-up-emails-case-study.html';
            } else if (req.url === '/blog/ai-chatbot-case-study') {
              req.url = '/blog/ai-chatbot-case-study.html';
            } else if (req.url === '/blog/ai-lead-generation-case-study') {
              req.url = '/blog/ai-lead-generation-case-study.html';
            } else if (req.url === '/blog/ai-email-reply-case-study') {
              req.url = '/blog/ai-email-reply-case-study.html';
            } else if (req.url === '/blog/whatsapp-ai-agent-case-study') {
              req.url = '/blog/whatsapp-ai-agent-case-study.html';
            } else if (req.url === '/blog/plumber-ai-chatbot-case-study') {
              req.url = '/blog/plumber-ai-chatbot-case-study.html';
            } else if (req.url === '/blog/insurance-ai-lead-generation-case-study') {
              req.url = '/blog/insurance-ai-lead-generation-case-study.html';
            } else if (req.url === '/blog/auto-repair-voice-ai-case-study') {
              req.url = '/blog/auto-repair-voice-ai-case-study.html';
            } else if (req.url === '/demo' || req.url === '/demo/') {
              req.url = '/demo/index.html';
            }
            next();
          });
        }
      },
      // DEV-ONLY: serve the same /api endpoints Vercel runs in production, so the
      // voice token + chat work under `npm run dev` WITHOUT inlining the key.
      // The key is used server-side here only; it never reaches the browser.
      {
        name: 'dev-gemini-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = (req.url || '').split('?')[0];
            const isToken = url === '/api/gemini-token';
            const isChat = url === '/api/chat';
            if (!isToken && !isChat) return next();
            if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method not allowed'); }

            res.setHeader('Content-Type', 'application/json');
            if (!GEMINI_API_KEY) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: 'Missing GEMINI_API_KEY in .env (dev)' }));
            }
            try {
              if (isToken) {
                const token = await mintLiveToken(GEMINI_API_KEY);
                return res.end(JSON.stringify({ token }));
              }
              const body = await readJsonBody(req);
              if (!body.message) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Missing message' })); }
              const reply = await generateChatReply(GEMINI_API_KEY, body.history || [], body.message);
              return res.end(JSON.stringify({ reply }));
            } catch (e) {
              console.error('[dev-gemini-api] error', e);
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: 'dev api error' }));
            }
          });
        },
      },
      react(),
    ],
    define: {
      'import.meta.env.VITE_WEBHOOK_URL': JSON.stringify(env.VITE_WEBHOOK_URL),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_LEAD_WEBHOOK_URL': JSON.stringify(env.VITE_LEAD_WEBHOOK_URL),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'framer-motion': ['framer-motion'],
            'react-vendor': ['react', 'react-dom'],
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
