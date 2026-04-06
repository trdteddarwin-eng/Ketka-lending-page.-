import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
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
            } else if (req.url === '/demo' || req.url === '/demo/') {
              req.url = '/demo/index.html';
            }
            next();
          });
        }
      },
      react(),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_WEBHOOK_URL': JSON.stringify(env.VITE_WEBHOOK_URL),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_WEBHOOK_SECRET': JSON.stringify(env.VITE_WEBHOOK_SECRET)
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
