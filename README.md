# Tedca.org

> The agency site for Tedca AI — voice-AI receptionist demo, lead-generation
> demo, blog system, Claude Code skills marketplace, and audit-report system,
> all in one Vite app.

**Live:** [https://tedca.org](https://tedca.org)
**Voice demo:** [tedca.org](https://tedca.org/) (start a 5-min Gemini Live call)
**Lead-gen demo:** [tedca.org/demo](https://tedca.org/demo)
**Skills marketplace:** [tedca.org/skills](https://tedca.org/skills)
**Blog:** [tedca.org/blog](https://tedca.org/blog) (9 SEO/AEO case studies)

A production agency site that doubles as a working demonstration of
every automation Tedca sells. Visitors don't read about voice AI; they pick
up the phone and talk to one. They don't read about lead generation;
they run a search and watch three verified emails land. The site is the
product brochure *and* the product trial.

---

## What this is

Tedca AI builds production automation for SMBs: voice agents, cold-outreach
pipelines, lead-gen, daily video factories, DTC e-commerce. This repo is
the agency's storefront. Every surface on the site is a working version of
something the agency sells:

- The home page boots a live Gemini Live voice agent you can roleplay against
  for 5 minutes per session.
- `/demo` runs a real lead-finder pipeline (Apify + AnyMailFinder) and
  returns verified owner emails behind an email-gate + per-IP rate limit.
- `/skills` is a paid marketplace for Claude Code skills with Stripe-verified
  delivery via a Netlify function.
- `/blog` is 9 hand-written case studies optimised for SEO and AEO (Answer
  Engine Optimization — LLM-citation-friendly structure).
- `/audits/<slug>` hosts per-client audit reports used in outreach.

The single Vite app boots the voice agent. Everything else is co-located
static HTML + serverless functions so each surface is independently
deployable and addressable.

---

## Features

- **Live Voice AI receptionist** — `@google/genai` Live API, real-time audio
  streaming via Web Audio API + ScriptProcessor, 5-minute session cap with a
  4-minute warning, up to 2 auto-reconnect attempts on dropped sockets,
  audio-quality tracking (`good` / `fair` / `poor`) based on inter-chunk gap
  histograms. Per-session rate limit with a cooldown timer.
- **Interactive lead-gen demo at `/demo`** — 4 API routes glued into a
  pipeline: `verify-email` (DNS MX lookup), `store-demo-email` (Supabase
  dedup), `demo-leads` (Apify Google Maps + AnyMailFinder verification),
  `deliver-skill` (Stripe-verified delivery for paid skills).
- **9 SEO/AEO blog posts** at `/blog/<slug>` — dental AI receptionist,
  plumber chatbot, insurance lead gen, auto-repair voice AI, AI follow-up
  emails, AI chatbot, AI lead gen, AI email reply, WhatsApp AI agent. Each
  is a case-study-format HTML page with structured data.
- **Claude Code skills marketplace at `/skills`** — production skills
  (Motion Graphic Video, Lead Generation Pipeline) sold via Stripe.
  The `deliver-skill` Netlify function maps a paid Stripe checkout session
  back to the right GitHub-hosted `.md` file and returns the skill content
  to the browser.
- **Per-client audit-report pages** at `/audits/<slug>` — used as outreach
  artifacts. Two are currently shipping (Phoenix Roofing, John Gluch
  Real Estate).
- **Cal.com booking embed** — `@calcom/embed-react`, lazy-loaded only on
  the booking flow.
- **Dual-target deploy** — Vercel (primary, with rewrites) and Netlify
  (mirror, with edge functions + asset minification + image compression).
  See `vercel.json` and `netlify.toml`.
- **Real CSP + security headers** — see `public/_headers` and `netlify.toml`
  `[[headers]]` blocks. CSP allow-lists the exact origins the app needs
  (Generative Language API, Cal.com, Spline, KIE, Google Fonts).
- **`llms.txt`** for AI crawlers, `sitemap.xml`, `robots.txt`, Bing
  (`BingSiteAuth.xml`) and Google (`googlecef51ec6cef5340a.html`) site
  verification files.
- **Lazy-loaded heavy components** — `SetupForm`, `ActiveCall`,
  `TranscriptSummary`, `ChatWidget`, and Cal embed are `React.lazy()` so the
  first paint doesn't include them.

---

## Tech stack

- **React** 19.2
- **Vite** 6.2 (build, dev server)
- **TypeScript** 5.8
- **Tailwind CSS** 4.2 (`@tailwindcss/postcss`)
- **framer-motion** 12.23 (entry / exit transitions on the voice-call UI)
- **@google/genai** 1.43 (Gemini Live API)
- **@calcom/embed-react** 1.5 (booking)
- **@radix-ui/react-slot** + **CVA** + **clsx** + **tailwind-merge** — shadcn-style component primitives
- **Vercel** (primary host) — serverless `api/*` routes
- **Netlify** (mirror host) — `netlify/functions/*` (esbuild bundled)
- **Supabase** (referenced by `store-demo-email`, `demo-leads`) — search dedup + lead cache
- **Apify** (Google Maps scraping) and **AnyMailFinder** (email verification) — called from `demo-leads`
- **Stripe** (referenced by `deliver-skill`) — checkout-session verification for skill marketplace

---

## Quick start

```bash
git clone https://github.com/trdteddarwin-eng/Ketka-lending-page.-.git
cd Ketka-lending-page.-
npm install
```

Create `.env.local` and set the API key needed by the voice agent:

```bash
# Required for the live voice agent on the home page
GEMINI_API_KEY=...
```

`api/*` (Vercel) and `netlify/functions/*` (Netlify) routes read their
secrets from the deploy environment, not `.env.local`. To run them locally
use `vercel dev` or `netlify dev` instead of plain `npm run dev`.

Then:

```bash
npm run dev      # localhost:5173 (or next free port)
npm run build    # → dist/
npm run preview  # serve dist/
```

### Deploy

- **Vercel**: `vercel --prod` (the project name is `tedca-org`). Required env
  vars: `GEMINI_API_KEY` (referenced as `process.env.API_KEY` in the Vite
  config), `APIFY_API_TOKEN`, `ANYMAILFINDER_API_KEY`, `SUPABASE_URL`,
  `SUPABASE_KEY`.
- **Netlify**: connect via the dashboard. Required env vars:
  `STRIPE_SECRET_KEY`, `GITHUB_TOKEN` (with `repo` scope; used by
  `deliver-skill` to pull skill `.md` files from private repos).

---

## Project structure

```
.
├── App.tsx                          Top-level voice-agent state machine
├── index.tsx                        React root
├── index.html                       Vite entry
├── constants.ts                     SYSTEM_INSTRUCTION_TEMPLATE + UI strings
├── types.ts                         AppState, BusinessConfig, TranscriptItem
├── components/
│   ├── ActiveCall.tsx               In-call UI (visualizer + transcript)
│   ├── SetupForm.tsx                Business config form
│   ├── TranscriptSummary.tsx        Post-call summary view
│   ├── ChatWidget.tsx               Floating chat widget
│   ├── ClaudeSkillsOverlay.tsx      Overlay for the skills page
│   ├── Visualizer.tsx               Audio-reactive viz
│   └── ui/                          shadcn-style primitives (button, hero,
│                                    lamp, background-boxes)
├── services/
│   └── geminiLive.ts                Gemini Live socket + audio pipeline
├── utils/
│   ├── audio-utils.ts               PCM encode/decode + base64 helpers
│   └── rateLimit.ts                 Per-session cooldown
├── api/                             Vercel functions (deploy: primary)
│   ├── verify-email.js              DNS MX lookup
│   ├── store-demo-email.js          Supabase dedup
│   ├── demo-leads.js                Apify + AnyMailFinder pipeline
│   └── deliver-skill.js             Stripe-verified skill delivery
├── netlify/functions/
│   └── deliver-skill.js             Netlify mirror of the skill function
├── public/
│   ├── demo/index.html              Lead-gen demo (separate static page)
│   ├── skills.html                  Skills marketplace
│   ├── delivered.html               Post-checkout skill download page
│   ├── blog/                        9 case-study HTML pages + index
│   ├── audits/                      Per-client audit-report pages
│   ├── videos/                      Hero + explainer videos
│   ├── _headers                     Netlify custom headers (CSP + caching)
│   ├── llms.txt
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── BingSiteAuth.xml
│   └── googlecef51ec6cef5340a.html  Google site verification
├── vercel.json                      Build + rewrites (blog / demo / skills)
├── netlify.toml                     Build + functions + headers + minify
├── tailwind.config.ts
├── postcss.config.js
└── vite.config.ts
```

---

## Engineering notes

**Why a single Vite app that fronts multiple static surfaces.** The home page
needs React (the voice agent is stateful, hot-paths through Web Audio, and
benefits from `framer-motion` transitions). `/demo`, `/skills`,
`/delivered`, and the 9 `/blog/*` pages don't. Keeping them as plain HTML
in `public/` means each one ships as a `<link rel="canonical">`-able URL
with its own `<head>` and structured data, and none of them carries the
voice-agent's React bundle. Vercel rewrites in `vercel.json` (and Netlify
redirects in `netlify.toml`) map clean URLs to those static files. The
trade-off: shared chrome between the React app and the static pages has to
be duplicated by hand. For a multi-purpose agency site this is the right
shape.

**Voice agent reliability.** `GeminiLiveService` runs a 5-minute session cap
with a 4-minute warning so the user has time to wrap up. Auto-reconnect on
socket drop is limited to 2 attempts to avoid death loops on a permanent
outage. Connection quality is tracked as a histogram of inter-audio-chunk
gaps and surfaced as `good` / `fair` / `poor` to the UI, which is how the
UI can show a degraded-experience warning before the call falls apart.

**Per-session cooldown, not per-IP.** `utils/rateLimit.ts` enforces a
client-side cooldown on the voice-demo session. Recruiters and curious
visitors get a generous single try; the cooldown stops accidental
spam from a single tab without requiring auth or a paid Cloudflare layer.
True per-IP rate limiting lives on the `/demo` lead-gen pipeline (server-side,
in `store-demo-email.js`).

**Dual deploy (Vercel + Netlify), not a vendor lock-in.** The agency runs both
because each is the better mirror for a different surface. Vercel hosts the
primary site and the lead-gen demo (its `api/*` routes are pure serverless
JS, no build config). Netlify hosts the skill-delivery flow because the
function bundler (`esbuild`) is fast for the small JS bundles and `netlify.toml`
is where asset minification + image compression are configured (those run on
Netlify but not on Vercel by default).

**Lazy-loaded components.** Five components (`SetupForm`, `ActiveCall`,
`TranscriptSummary`, `ChatWidget`, the Cal.com embed) are `React.lazy()`d
behind `Suspense` boundaries. First paint is the marketing hero + a
"start the demo" CTA; the heavy voice-agent UI doesn't load until the user
commits.

**Skill delivery via Stripe-session verification, not session cookies.**
`deliver-skill` accepts a Stripe `session_id` or an email, looks up the
matching completed checkout session via the Stripe API, maps the
`prod_*` product ID to a GitHub path via a static `SKILL_MAP`, and returns
the file content fetched from GitHub Raw. Stateless — no signed cookies, no
database session table. The trade-off: the function holds a Stripe key and a
GitHub PAT with `repo` scope; both live in Netlify env, both are
narrowly scoped, and the function does no other operations.

**Real CSP, not the boilerplate.** `public/_headers` defines a `Content-Security-Policy`
that allow-lists exactly the origins the app uses (the Generative Language
API, Cal.com, Spline 3D, KIE, Google Fonts, the AI Studio CDN). `object-src
'none'`, `base-uri 'self'`, `frame-src` limited to Cal + Spline. The CSP
makes the deploy survive a future XSS attempt because there's no exfil
channel for an injected script to reach.

**Audit reports as outreach artifacts.** Per-client audits at `/audits/<slug>`
ship with the deploy. Cold outreach references the URL; the prospect lands
on a personalised page; the page can include real revenue estimates,
competitor analysis, recommendations. It's a build-once, send-many pattern
that converts at materially higher rates than a generic landing page.

---

## Deployment

- **Vercel** primary at `tedca.org`. `vercel.json` defines the rewrites that
  power clean URLs for `/blog/<slug>`, `/demo`, `/delivered`, `/skills`.
- **Netlify** mirror — used for `deliver-skill` and for image/asset
  optimisation. See `netlify.toml`.
- **DNS** points the apex + `www` at Vercel; the Netlify mirror lives on
  its `*.netlify.app` URL and is fronted by the skill-delivery flow.

---

## Roadmap / known limits

- **Stripe webhook**, not just polling. `deliver-skill` searches recent
  completed sessions; a webhook would let the delivery email fire seconds
  after checkout instead of the user having to click the post-checkout
  return link.
- **No `delete` path for the per-IP demo dedup**. Once a user has used
  their free `/demo` search, there's no in-app way to reset. The agency
  resets it manually in Supabase today; a one-time-token bounce-back flow
  would close the loop.
- **The voice agent's `ScriptProcessorNode` is deprecated** in favour of
  `AudioWorkletNode`. Browsers still ship it but a refactor is overdue.
- **Single-source-of-truth chrome.** Nav, footer, and SEO meta are shared
  between the React app (`App.tsx`) and the static pages (`public/*.html`,
  `public/blog/*.html`). A tiny build script that templates them from one
  source would cut maintenance cost.

---

## License

No license file is currently committed. Source-available for portfolio review.
Ask before reusing.
