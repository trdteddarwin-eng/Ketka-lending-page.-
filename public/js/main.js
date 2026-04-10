// =============================================
// main.js — Extracted from inline <script> blocks
// Loaded with defer (DOM is parsed before execution)
// =============================================

// ── HIW Step Data & Card Selection ──
const hiwStepData = { 1: { icon: '<svg width="20" height="20" fill="none" stroke="#000" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>', title: "Call Comes In", details: [{ label: "What Happens", text: "Your AI receptionist answers instantly—no rings, no hold music, no voicemail." }, { label: "Behind the Scenes", text: "AI activates within 1 second, identifies incoming number, and prepares to assist." }, { label: "What Caller Hears", text: '"Hi! Thanks for calling [Your Business]. This is Sophie. How can I help you today?"' }], roi: "Never miss another call—even at 2am on a holiday." }, 2: { icon: '<svg width="20" height="20" fill="none" stroke="#000" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', title: "Greets & Identifies", details: [{ label: "What Happens", text: "AI asks if they're a new or returning customer. Existing customers are recognized instantly." }, { label: "Behind the Scenes", text: "CRM lookup happens in real-time. Their history and preferences are pulled up." }, { label: "What Caller Hears", text: '"Are you an existing customer with us, or is this your first time calling?"' }], roi: "Returning customers feel valued. New leads get captured automatically." }, 3: { icon: '<svg width="20" height="20" fill="none" stroke="#000" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', title: "Asks Intent", details: [{ label: "What Happens", text: "AI asks what they need help with—booking, questions, rescheduling, pricing." }, { label: "Behind the Scenes", text: "Intent classification determines the best path forward." }, { label: "What Caller Hears", text: '"What can I help you with—schedule an appointment, or did you have a question?"' }], roi: "No more endless phone tag or playing voicemail roulette." }, 4: { icon: '<svg width="20" height="20" fill="none" stroke="#000" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', title: "Answers Questions", details: [{ label: "What Happens", text: "AI answers questions using your custom knowledge base—pricing, services, hours, policies." }, { label: "Behind the Scenes", text: "Knowledge base search retrieves accurate, up-to-date information." }, { label: "What Caller Hears", text: '"Our teeth cleaning starts at $150, and we accept most major insurance plans."' }], roi: "Callers get instant answers—no callbacks, no waiting." }, 5: { icon: '<svg width="20" height="20" fill="none" stroke="#000" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', title: "Books Appointment", details: [{ label: "What Happens", text: "AI checks your real-time calendar, finds available slots, and books the appointment." }, { label: "Behind the Scenes", text: "Live calendar integration checks availability and prevents double-booking." }, { label: "What Caller Hears", text: '"I have Tuesday at 2pm or Thursday at 10am available. Which works better?"' }], roi: "Appointments booked in seconds—not days of phone tag." }, 6: { icon: '<svg width="20" height="20" fill="none" stroke="#000" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', title: "Confirmation", details: [{ label: "What Happens", text: "Caller receives confirmation. You get notified. Everything is logged in your CRM." }, { label: "Behind the Scenes", text: "SMS/email confirmation sent. Appointment added to calendar. CRM updated." }, { label: "What Caller Hears", text: "\"You're all set for Tuesday at 2pm! I'll send you a text confirmation.\"" }], roi: "Zero manual data entry. Complete call records automatically." } }; let hiwActiveCard = null; function selectHiwCard(step) { const panel = document.getElementById('hiwDropdownPanel'), content = document.getElementById('hiwDropdownContent'), allCards = document.querySelectorAll('.hiw-card-inner'); if (hiwActiveCard === step) { panel.classList.remove('open'); allCards.forEach(c => c.classList.remove('active')); hiwActiveCard = null; return } allCards.forEach(c => c.classList.remove('active')); document.querySelector(`[data-step="${step}"] .hiw-card-inner`).classList.add('active'); hiwActiveCard = step; const d = hiwStepData[step]; const ic = '<svg width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'; content.innerHTML = `<div class="hiw-dropdown-header"><div class="hiw-dropdown-icon">${d.icon}</div><h3 class="hiw-dropdown-title">${d.title}</h3></div>${d.details.map(dt => `<div class="hiw-detail-item"><div class="hiw-detail-icon">${ic}</div><div><p class="hiw-detail-label">${dt.label}</p><p class="hiw-detail-text">${dt.text}</p></div></div>`).join('')}<div class="hiw-roi-callout"><p class="hiw-roi-label">💰 ROI Impact</p><p class="hiw-roi-text">${d.roi}</p></div>`; panel.classList.add('open') }


// ── Timeline Toggle ──
        let tlExpanded = false;

        function toggleTlSteps() {
            const container = document.getElementById('tl-steps-container');
            const btnText = document.getElementById('tl-btn-text');
            const btn = document.getElementById('tl-expand-btn');

            tlExpanded = !tlExpanded;

            if (tlExpanded) {
                container.style.gridTemplateRows = '1fr';
                container.classList.add('tl-steps-visible');
                btn.classList.add('tl-expanded');
                btnText.textContent = 'Hide steps';
            } else {
                container.style.gridTemplateRows = '0fr';
                container.classList.remove('tl-steps-visible');
                btn.classList.remove('tl-expanded');
                btnText.textContent = 'View all steps';

                // Reset hidden step animations
                document.querySelectorAll('.tl-hidden-step').forEach(step => {
                    step.style.animation = 'none';
                    step.offsetHeight; // Trigger reflow
                    step.style.animation = '';
                });
            }
        }


// ── Cal.com Loader ──
        (function (C, A, L) {
            let p = function (a, ar) { a.q.push(ar); };
            let d = C.document;
            C.Cal = C.Cal || function () {
                let cal = C.Cal;
                let ar = arguments;
                if (!cal.loaded) {
                    cal.ns = {};
                    cal.q = cal.q || [];
                    d.head.appendChild(d.createElement("script")).src = A;
                    cal.loaded = true;
                }
                if (ar[0] === L) {
                    const api = function () { p(api, arguments); };
                    const namespace = ar[1];
                    api.q = api.q || [];
                    if (typeof namespace === "string") {
                        cal.ns[namespace] = cal.ns[namespace] || api;
                        p(cal.ns[namespace], ar);
                        p(cal, ["initNamespace", namespace]);
                    } else p(cal, ar);
                    return;
                }
                p(cal, ar);
            };
        })(window, "https://app.cal.com/embed/embed.js", "init");

        Cal("init", "30min", { origin: "https://app.cal.com" });
        Cal.ns["30min"]("inline", {
            elementOrSelector: "#my-cal-inline-30min",
            config: { "layout": "month_view" },
            calLink: "tedca-skill-nv7wuk/secret",
        });
        Cal.ns["30min"]("ui", {
            "styles": { "branding": { "brandColor": "#000000" } },
            "hideEventTypeDetails": false,
            "layout": "month_view"
        });


// ── Main Logic (Calculator, Form Handlers, Services, Flowchart, Agentic, Pipeline Sim) ──
        // Calculator Logic
        const callsSlider = document.getElementById('calls-slider');
        const valueSlider = document.getElementById('value-slider');
        const rateSlider = document.getElementById('rate-slider');

        const updateCalculator = () => {
            const calls = parseInt(callsSlider.value);
            const value = parseInt(valueSlider.value);
            const rate = parseInt(rateSlider.value) / 100;

            document.getElementById('calls-val').textContent = calls;
            document.getElementById('value-val').textContent = `$${value}`;
            document.getElementById('rate-val').textContent = `${Math.round(rate * 100)}%`;

            const weeklyLoss = calls * value * rate;
            const annualLoss = weeklyLoss * 52;

            document.getElementById('total-loss').textContent = `$${annualLoss.toLocaleString()}`;
        };

        if (callsSlider) {
            callsSlider.addEventListener('input', updateCalculator);
            valueSlider.addEventListener('input', updateCalculator);
            rateSlider.addEventListener('input', updateCalculator);
        }

        // Sticky CTA
        window.addEventListener('scroll', () => {
            const stickyCta = document.getElementById('sticky-cta');
            if (window.scrollY > 600) {
                stickyCta.classList.remove('translate-y-full');
            } else {
                stickyCta.classList.add('translate-y-full');
            }
        });

        // Live Counter Animation
        setInterval(() => {
            const counter = document.getElementById('live-loss-counter');
            if (counter) {
                let current = parseFloat(counter.textContent.replace(/,/g, ''));
                current += 12.50;
                counter.textContent = current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        }, 2000);



        // --- REACT APP TRIGGER LOGIC ---

        // Form Submit -> Start Demo with Config
        const form = document.getElementById('demoFormElement');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const config = {
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    email: formData.get('email'),
                };

                // Dispatch event to React App
                window.dispatchEvent(new CustomEvent('start-demo', { detail: config }));
            });
        }

        // Pricing Tab Logic
        function showPricingTab(tab) {
            const voiceEl = document.getElementById('pricing-voice');
            const autoEl = document.getElementById('pricing-automation');
            const tabVoice = document.getElementById('tab-voice');
            const tabAuto = document.getElementById('tab-automation');
            if (tab === 'voice') {
                voiceEl.style.display = '';
                autoEl.style.display = 'none';
                tabVoice.className = 'px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest border border-dark bg-dark text-paper transition-all pointer-events-auto';
                tabAuto.className = 'px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest border border-dark/20 text-dark hover:border-dark transition-all pointer-events-auto';
            } else {
                voiceEl.style.display = 'none';
                autoEl.style.display = '';
                tabAuto.className = 'px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest border border-dark bg-dark text-paper transition-all pointer-events-auto';
                tabVoice.className = 'px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest border border-dark/20 text-dark hover:border-dark transition-all pointer-events-auto';
            }
        }

        // Services Tab Logic
        function showServicesTab(tab) {
            if (typeof closeFlowchartModal === 'function') closeFlowchartModal();
            const panels = {
                automation: document.getElementById('svc-automation'),
                voice: document.getElementById('svc-voice'),
                agentic: document.getElementById('svc-agentic')
            };
            const tabs = {
                automation: document.getElementById('svc-tab-automation'),
                voice: document.getElementById('svc-tab-voice'),
                agentic: document.getElementById('svc-tab-agentic')
            };
            const activeClass = 'px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest border border-dark bg-dark text-paper transition-all pointer-events-auto';
            const inactiveClass = 'px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest border border-dark/20 text-dark hover:border-dark transition-all pointer-events-auto';

            // Hide all panels, deactivate all tabs
            Object.values(panels).forEach(p => { if (p) { p.style.display = 'none'; p.classList.remove('tab-active'); } });
            Object.values(tabs).forEach(t => { if (t) t.className = inactiveClass; });

            // Show selected panel, activate tab
            if (panels[tab]) { panels[tab].style.display = ''; panels[tab].classList.add('tab-active'); }
            if (tabs[tab]) tabs[tab].className = activeClass;

            // Toggle voice-only sections
            document.querySelectorAll('.voice-only-section').forEach(function(s) {
                if (tab === 'voice') {
                    s.classList.remove('vos-hidden');
                } else {
                    s.classList.add('vos-hidden');
                }
            });

            // Tab-specific animations
            if (tab === 'automation') {
                const cards = panels[tab]?.querySelectorAll('.auto-card');
                if (cards) cards.forEach((card, i) => {
                    card.classList.remove('revealed');
                    card.style.opacity = '0';
                    requestAnimationFrame(() => {
                        card.style.setProperty('--i', i);
                        card.classList.add('revealed');
                    });
                });
            }
            if (tab === 'voice') {
                // Re-trigger HIW card animations via reflow
                const hiwCards = panels[tab]?.querySelectorAll('.hiw-flow-card');
                if (hiwCards) hiwCards.forEach(card => {
                    card.style.animation = 'none';
                    card.offsetHeight; // trigger reflow
                    card.style.animation = '';
                });
                // Also re-trigger subtitle/badge animations
                const animEls = panels[tab]?.querySelectorAll('.hiw-subtitle, .hiw-badge, .hiw-title-line, .hiw-custom-banner, .hiw-swipe-hint');
                if (animEls) animEls.forEach(el => {
                    el.style.animation = 'none';
                    el.offsetHeight;
                    el.style.animation = '';
                });
            }
            if (tab === 'agentic') {
                window.dispatchEvent(new Event('sim-trigger'));
            }
        }

        // Staggered reveal for automation grid cards
        const autoGrid = document.getElementById('svc-automation');
        if (autoGrid) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const cards = entry.target.querySelectorAll('.auto-card');
                        cards.forEach((card, i) => {
                            card.style.setProperty('--i', i);
                            card.classList.add('revealed');
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            observer.observe(autoGrid);
        }

        // Scroll reveal for all scroll-pop and scroll-reveal-cards elements
        const scrollRevealObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    scrollRevealObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        document.querySelectorAll('.scroll-pop, .scroll-reveal-cards > *').forEach(el => scrollRevealObs.observe(el));

        // Re-observe when agentic tab becomes visible (elements start hidden)
        const agenticTab = document.getElementById('svc-tab-agentic');
        if (agenticTab) {
            agenticTab.addEventListener('click', () => {
                setTimeout(() => {
                    document.querySelectorAll('#svc-agentic .scroll-pop, #svc-agentic .scroll-reveal-cards > *').forEach(el => {
                        el.classList.remove('revealed');
                        scrollRevealObs.observe(el);
                    });
                }, 50);
            });
        }

        // ── Flowchart Modal System ──
        const FLOWCHART_DATA = {
            'auto-followup': {
                title: 'Auto Follow-Up Emails',
                subtitle: 'Never let a lead go cold again',
                videoSrc: '/videos/auto-followup.mp4',
                blogUrl: '/blog/ai-follow-up-emails-case-study',
                summary: 'New leads get instant AI follow-up. Cold leads get reactivated automatically. Businesses using AI follow-ups recover 41% more deals that would have gone cold.',
                nodes: [
                    { id: 'n0', label: 'Lead enters CRM', icon: 'fa-solid fa-user-plus', type: 'trigger', desc: 'New contact added via form, call, or manual entry' },
                    { id: 'n1', label: 'No reply detected (3 days)', icon: 'fa-solid fa-clock', type: 'trigger', desc: 'System monitors inbox for a response within your set window' },
                    { id: 'n2', label: 'Personalizes with lead data', icon: 'fa-solid fa-user-pen', type: 'ai', desc: 'Pulls name, company, pain points, and past interactions for context' },
                    { id: 'n3', label: 'AI generates follow-up', icon: 'fa-solid fa-wand-magic-sparkles', type: 'ai', desc: 'Creates a natural, on-brand email tailored to the lead' },
                    { id: 'n4', label: 'Email sent automatically', icon: 'fa-solid fa-paper-plane', type: 'ai', desc: 'Delivers at optimal send time for maximum open rates' },
                    { id: 'n5', label: 'Sequence adjusts on engagement', icon: 'fa-solid fa-arrows-split-up-and-left', type: 'ai', desc: 'If they open but dont reply, tone and timing adapt automatically' },
                    { id: 'n6', label: 'Opens & clicks tracked', icon: 'fa-solid fa-chart-line', type: 'outcome', desc: 'Full engagement analytics logged in your dashboard in real time' }
                ],
                edges: [
                    { from: 'n0', to: 'n1' }, { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
                    { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' }, { from: 'n5', to: 'n6' }
                ]
            },
            'ai-chatbot': {
                title: '24/7 AI Chatbot',
                subtitle: 'Instant answers, around the clock',
                videoSrc: '/videos/ai-chatbot.mp4',
                blogUrl: '/blog/ai-chatbot-case-study',
                summary: 'AI answers every visitor\'s question instantly and books appointments directly into your calendar. Businesses with AI chatbots see 47% more booked appointments.',
                nodes: [
                    { id: 'n0', label: 'Customer visits site', icon: 'fa-solid fa-globe', type: 'trigger', desc: 'Visitor lands on any page of your website or app' },
                    { id: 'n1', label: 'Bot activates', icon: 'fa-solid fa-robot', type: 'trigger', desc: 'Chat widget appears after a set delay or on page scroll' },
                    { id: 'n2', label: 'Understands intent', icon: 'fa-solid fa-brain', type: 'ai', desc: 'NLP engine identifies what the customer is really asking for' },
                    { id: 'n3', label: 'Checks knowledge base', icon: 'fa-solid fa-book-open', type: 'ai', desc: 'Searches your FAQs, service pages, and pricing info for the best answer' },
                    { id: 'n4', label: 'Provides answer', icon: 'fa-solid fa-comment-dots', type: 'ai', desc: 'Delivers a clear, conversational response in your brand voice' },
                    { id: 'n5', label: 'Logs conversation & captures lead', icon: 'fa-solid fa-address-book', type: 'outcome', desc: 'Saves chat transcript and captures name, email, and phone if shared' },
                    { id: 'n6', label: 'Escalates if needed', icon: 'fa-solid fa-headset', type: 'outcome', desc: 'Complex questions get routed to a human with full context attached' }
                ],
                edges: [
                    { from: 'n0', to: 'n1' }, { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
                    { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' }, { from: 'n5', to: 'n6' }
                ]
            },
            'ai-lead-gen': {
                title: 'AI Lead Generation',
                subtitle: 'Find your next customer on autopilot',
                videoSrc: '/videos/ai-lead-gen.mp4',
                blogUrl: '/blog/ai-lead-generation-case-study',
                summary: 'AI scans multiple channels, identifies ideal prospects, and delivers qualified leads straight to your pipeline — no manual prospecting.',
                nodes: [
                    { id: 'n0', label: 'Define ideal customer profile', icon: 'fa-solid fa-crosshairs', type: 'trigger', desc: 'Set industry, size, location, and budget criteria for your perfect lead' },
                    { id: 'n1', label: 'AI scans multiple sources', icon: 'fa-solid fa-satellite-dish', type: 'ai', desc: 'Searches directories, social media, review sites, and public databases' },
                    { id: 'n2', label: 'Matches & scores prospects', icon: 'fa-solid fa-ranking-star', type: 'ai', desc: 'Ranks each prospect 0-100 based on fit, intent signals, and timing' },
                    { id: 'n3', label: 'Enriches contact data', icon: 'fa-solid fa-address-card', type: 'ai', desc: 'Finds email, phone, company size, and decision-maker info automatically' },
                    { id: 'n4', label: 'Verifies email deliverability', icon: 'fa-solid fa-envelope-circle-check', type: 'ai', desc: 'Checks every email to prevent bounces and protect sender reputation' },
                    { id: 'n5', label: 'Pushes to CRM & pipeline', icon: 'fa-solid fa-database', type: 'outcome', desc: 'Creates CRM record with full profile, ready for outreach sequence' },
                    { id: 'n6', label: 'Triggers outreach sequence', icon: 'fa-solid fa-paper-plane', type: 'outcome', desc: 'Kicks off personalized multi-touch email campaign automatically' }
                ],
                edges: [
                    { from: 'n0', to: 'n1' },
                    { from: 'n1', to: 'n2' },
                    { from: 'n2', to: 'n3' },
                    { from: 'n3', to: 'n4' },
                    { from: 'n4', to: 'n5' },
                    { from: 'n5', to: 'n6' }
                ]
            },
            'auto-email-reply': {
                title: 'Automatic Email Reply',
                subtitle: 'AI reads and replies in your voice',
                videoSrc: '/videos/auto-email-reply.mp4',
                blogUrl: '/blog/ai-email-reply-case-study',
                summary: 'Your AI customer service agent scans every incoming email, drafts replies in your voice, auto-sends routine responses, and notifies you about important messages. Response time drops from hours to seconds.',
                nodes: [
                    { id: 'n0', label: 'Email arrives in inbox', icon: 'fa-solid fa-envelope', type: 'trigger', desc: 'New email detected in your connected Gmail or Outlook account' },
                    { id: 'n1', label: 'AI reads & classifies', icon: 'fa-solid fa-brain', type: 'ai', desc: 'Understands intent — inquiry, complaint, scheduling, spam, or FYI' },
                    { id: 'n2', label: 'Pulls relevant context', icon: 'fa-solid fa-magnifying-glass', type: 'ai', desc: 'Checks CRM history, past conversations, and knowledge base for context' },
                    { id: 'n3', label: 'Drafts reply in your voice', icon: 'fa-solid fa-pen-fancy', type: 'ai', desc: 'Generates a reply that matches your tone, style, and brand guidelines' },
                    { id: 'n4', label: 'Routes for approval or sends', icon: 'fa-solid fa-route', type: 'ai', desc: 'Auto-sends routine replies; flags complex ones for your quick review' },
                    { id: 'n5', label: 'Logs in CRM thread', icon: 'fa-solid fa-timeline', type: 'outcome', desc: 'Stores the full conversation in your CRM with tags and timestamps' },
                    { id: 'n6', label: 'Follow-up scheduled if needed', icon: 'fa-solid fa-clock', type: 'outcome', desc: 'Sets a reminder to follow up if no response within your chosen window' }
                ],
                edges: [
                    { from: 'n0', to: 'n1' },
                    { from: 'n1', to: 'n2' },
                    { from: 'n2', to: 'n3' },
                    { from: 'n3', to: 'n4' },
                    { from: 'n4', to: 'n5' },
                    { from: 'n5', to: 'n6' }
                ]
            },
            'whatsapp-ai': {
                title: 'WhatsApp AI Agent',
                subtitle: 'Customer support that never sleeps',
                videoSrc: '/videos/whatsapp-ai.mp4',
                blogUrl: '/blog/whatsapp-ai-agent-case-study',
                summary: 'Your AI sales agent on WhatsApp answers questions, books appointments, sends quotes, and closes deals by sending Stripe payment links directly in chat. Works 24/7.',
                nodes: [
                    { id: 'n0', label: 'Customer messages WhatsApp', icon: 'fa-brands fa-whatsapp', type: 'trigger', desc: 'Incoming message detected on your WhatsApp Business number' },
                    { id: 'n1', label: 'AI understands intent', icon: 'fa-solid fa-brain', type: 'ai', desc: 'Natural language processing determines what the customer needs' },
                    { id: 'n2', label: 'Checks knowledge base', icon: 'fa-solid fa-book-open', type: 'ai', desc: 'Searches your FAQs, product catalog, pricing, and service details' },
                    { id: 'n3', label: 'Sends personalized reply', icon: 'fa-solid fa-comment-dots', type: 'ai', desc: 'Responds in your brand voice with accurate, helpful information' },
                    { id: 'n4', label: 'Can book or quote', icon: 'fa-solid fa-calendar-check', type: 'ai', desc: 'Books appointments, sends price quotes, or processes simple orders' },
                    { id: 'n5', label: 'Escalates if needed', icon: 'fa-solid fa-headset', type: 'outcome', desc: 'Routes complex issues to a human agent with full conversation context' },
                    { id: 'n6', label: 'Conversation logged', icon: 'fa-solid fa-database', type: 'outcome', desc: 'Every chat stored in CRM with customer profile and interaction history' }
                ],
                edges: [
                    { from: 'n0', to: 'n1' },
                    { from: 'n1', to: 'n2' },
                    { from: 'n2', to: 'n3' },
                    { from: 'n3', to: 'n4' },
                    { from: 'n4', to: 'n5' },
                    { from: 'n5', to: 'n6' }
                ]
            }
        };

        // ── Modal open/close ──
        let fcScrollLocked = false;
        function openFlowchartModal(automationId) {
            const data = FLOWCHART_DATA[automationId];
            if (!data) return;
            document.getElementById('fcTitle').textContent = data.title;
            document.getElementById('fcSubtitle').textContent = data.subtitle;
            document.getElementById('fcSummary').textContent = data.summary;
            const caseStudyLink = document.getElementById('fcCaseStudyLink');
            if (caseStudyLink) {
                if (data.blogUrl) {
                    caseStudyLink.href = data.blogUrl + '.html';
                    caseStudyLink.style.display = 'inline-block';
                    caseStudyLink.onclick = function() { closeFlowchartModal(); };
                } else {
                    caseStudyLink.style.display = 'none';
                }
            }
            document.getElementById('fcBackdrop').classList.add('fc-open');
            document.getElementById('fcModal').classList.add('fc-open');
            document.body.style.overflow = 'hidden';
            fcScrollLocked = true;
            renderFlowchart(automationId);
        }
        function closeFlowchartModal() {
            document.getElementById('fcBackdrop').classList.remove('fc-open');
            document.getElementById('fcModal').classList.remove('fc-open');
            if (fcScrollLocked) { document.body.style.overflow = ''; fcScrollLocked = false; }
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') { closeFlowchartModal(); closeSkillModal(); }
        });

        // Card click handlers
        document.querySelectorAll('.auto-card[data-automation]').forEach(function(card) {
            card.addEventListener('click', function() {
                openFlowchartModal(this.dataset.automation);
            });
        });

        // ── Agentic Expand System ──
        const AGENTIC_DATA = {
            'tiktok': {
                title: 'Motion Graphic Video Creation Pipeline',
                steps: [
                    { label: 'Script Generation', icon: 'fa-solid fa-scroll', type: 'trigger', desc: 'AI writes a hook-driven script optimized for TikTok engagement and retention.' },
                    { label: 'Scene Composition', icon: 'fa-solid fa-film', type: 'ai', desc: 'Breaks the script into timed scenes with visual direction and motion cues.' },
                    { label: 'AI Narration', icon: 'fa-solid fa-microphone', type: 'ai', desc: 'ElevenLabs generates a natural voiceover matched to the script timing.' },
                    { label: 'Sound Effects', icon: 'fa-solid fa-volume-high', type: 'ai', desc: 'AI-generated SFX layered at key moments for emphasis and engagement.' },
                    { label: 'Render & Export', icon: 'fa-solid fa-clapperboard', type: 'outcome', desc: 'Remotion compiles all assets into a ready-to-post vertical video.' }
                ],
                videos: [
                    { src: '/videos/ChatbotExplained.mp4', label: 'Chatbot Explained' },
                    { src: '/videos/SEOExplained.mp4', label: 'SEO Explained' }
                ],
                buyLink: 'https://buy.stripe.com/eVqaEQ57a4AS0nP9G63F60b'
            },
            'lead-gen': {
                title: 'Lead Generation Pipeline',
                steps: [
                    { label: 'Search', icon: 'fa-solid fa-magnifying-glass-location', type: 'trigger', desc: 'Searches Google Maps across all your target locations in one pass. Pulls every matching business \u2014 name, phone, website, address, star rating, and review count.' },
                    { label: 'Scrape', icon: 'fa-solid fa-download', type: 'trigger', desc: 'Extracts business details from each listing. Captures owner information, service categories, and online presence.' },
                    { label: 'Enrich', icon: 'fa-solid fa-envelope-circle-check', type: 'ai', desc: 'Finds the actual business owner\u2019s email from their website domain. Verifies and scores each email by confidence level.' },
                    { label: 'Deliver', icon: 'fa-solid fa-table', type: 'outcome', desc: 'Pushes everything to a clean, deduplicated Google Sheet sorted by review count. Ready for outreach \u2014 no cleanup needed.' }
                ],
                videos: [
                    { src: '/videos/LeadGenPipeline.mp4', label: 'Lead Gen Pipeline Explainer' }
                ],
                videoHeading: 'See How It Works',
                videoSubheading: 'A quick look at how this skill finds real CEOs and delivers verified leads — ready for outreach.',
                buyLink: 'https://buy.stripe.com/dRm5kw6be5EWc6xg4u3F60e'
            }
        };

        let activeAgenticCard = null;

        function toggleAgenticExpand(cardId) {
            var panel = document.getElementById('agentic-expand');
            var content = document.getElementById('agentic-expand-content');
            var cards = document.querySelectorAll('.agentic-card[data-agentic]');

            // If clicking the same card, collapse
            if (activeAgenticCard === cardId) {
                panel.classList.remove('agentic-open');
                cards.forEach(function(c) { c.classList.remove('agentic-active'); });
                if (typeof window.stopPipelineSim === 'function') window.stopPipelineSim();
                activeAgenticCard = null;
                return;
            }

            // Highlight active card
            cards.forEach(function(c) { c.classList.remove('agentic-active'); });
            var clickedCard = document.querySelector('[data-agentic="' + cardId + '"]');
            if (clickedCard) clickedCard.classList.add('agentic-active');

            var data = AGENTIC_DATA[cardId];
            if (!data) return;

            // Build content
            var html = '<div style="margin-bottom:12px;"><span class="font-heading text-sm font-bold text-dark uppercase tracking-tight">' + data.title + '</span></div>';

            data.steps.forEach(function(step, i) {
                if (i > 0) html += '<div class="agentic-connector"></div>';
                html += '<div class="agentic-step" style="transition-delay:' + (i * 100) + 'ms;">';
                html += '<div class="agentic-step-accent ' + step.type + '"></div>';
                html += '<div class="agentic-step-badge">' + (i + 1) + '</div>';
                html += '<div class="agentic-step-icon ' + step.type + '"><i class="' + step.icon + '"></i></div>';
                html += '<div><div class="agentic-step-label">' + step.label + '</div>';
                html += '<div class="agentic-step-desc">' + step.desc + '</div></div>';
                html += '</div>';
            });

            // Videos section
            if (data.videos && data.videos.length) {
                var vHeading = data.videoHeading || 'Videos Created by This Pipeline';
                var vSub = data.videoSubheading || '';
                html += '<div style="margin-top:20px;"><span class="font-heading text-xs font-bold text-dark uppercase tracking-tight">' + vHeading + '</span>';
                if (vSub) html += '<p class="font-sans text-xs text-dark/50 mt-1">' + vSub + '</p>';
                html += '</div>';
                html += '<div class="agentic-video-row">';
                data.videos.forEach(function(v) {
                    html += '<div class="agentic-video-cell">';
                    html += '<video src="' + v.src + '" controls playsinline preload="none"></video>';
                    html += '<div class="agentic-vid-label">' + v.label + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            // Pipeline simulation (Website Redesign Pipeline)
            if (data.showPipeline) {
                html += '<div style="margin-top:24px; background:#111; border-radius:0; padding:0; overflow:hidden;">';
                html += '<div style="text-align:center; padding:24px 16px 12px;"><span class="text-[10px] font-mono font-bold uppercase tracking-widest" style="color:rgba(255,255,255,0.4);">Watch It Work</span>';
                html += '<h3 class="font-heading text-2xl md:text-3xl font-bold tracking-tighter uppercase" style="color:#fff; margin:8px 0 4px;">5 Steps. <span style="color:#E63B2E;">One Automated Pipeline.</span></h3>';
                html += '<p class="font-sans text-xs" style="color:rgba(255,255,255,0.5); max-width:500px; margin:0 auto;">Watch the pipeline scrape a site, screenshot it, analyze conversion issues, build a modern redesign, and draft the outreach email.</p></div>';
                html += '<div class="pipeline-sim" id="pipeline-sim">';
                html += '<div class="pipeline-sim-header"><div style="display:flex;align-items:center;gap:16px;"><span class="sim-title">TEDCA AI Pipeline</span><span class="sim-client">[ACME Plumbing]</span></div><div style="display:flex;align-items:center;gap:16px;"><span class="sim-live"><span class="live-dot"></span> LIVE</span><span class="sim-timer" id="sim-timer">00:00</span></div></div>';
                html += '<div class="pipeline-sim-body"><div class="sim-agents-grid">';
                html += '<div class="sim-agent-card idle" id="sim-researcher"><div class="sim-agent-name"><span><i class="fa-solid fa-magnifying-glass" style="color:#60a5fa;margin-right:6px;font-size:10px;"></i>Researcher</span><span class="sim-badge idle" id="sim-researcher-badge">Idle</span></div><div class="sim-agent-task" id="sim-researcher-task">Waiting for lead...</div><div class="sim-completed-list" id="sim-researcher-completed"></div></div>';
                html += '<div class="sim-agent-card idle" id="sim-designer"><div class="sim-agent-name"><span><i class="fa-solid fa-paintbrush" style="color:#c084fc;margin-right:6px;font-size:10px;"></i>Designer</span><span class="sim-badge idle" id="sim-designer-badge">Idle</span></div><div class="sim-agent-task" id="sim-designer-task">Waiting for research...</div><div class="sim-completed-list" id="sim-designer-completed"></div></div>';
                html += '<div class="sim-agent-card idle" id="sim-judge"><div class="sim-agent-name"><span><i class="fa-solid fa-gavel" style="color:#fbbf24;margin-right:6px;font-size:10px;"></i>Judge</span><span class="sim-badge idle" id="sim-judge-badge">Idle</span></div><div class="sim-agent-task" id="sim-judge-task">Waiting for site...</div><div class="sim-completed-list" id="sim-judge-completed"></div></div>';
                html += '<div class="sim-agent-card idle" id="sim-ops"><div class="sim-agent-name"><span><i class="fa-solid fa-rocket" style="color:#34d399;margin-right:6px;font-size:10px;"></i>Ops</span><span class="sim-badge idle" id="sim-ops-badge">Idle</span></div><div class="sim-agent-task" id="sim-ops-task">Waiting for approval...</div><div class="sim-completed-list" id="sim-ops-completed"></div></div>';
                html += '</div><div class="sim-activity-log" id="sim-log"><div class="log-title">Activity Log</div></div></div>';
                html += '<div class="sim-output-bar" id="sim-output-bar"><span class="output-label">OUTPUT</span><span class="output-item"><i class="fa-solid fa-globe"></i> acme-plumbing.netlify.app deployed</span><span class="output-item"><i class="fa-solid fa-envelope"></i> Outreach email sent</span><span class="output-item"><i class="fa-solid fa-clock"></i> Follow-ups scheduled</span></div>';
                html += '</div></div>';
            }

            // Buy button at bottom of expand panel
            if (data.buyLink) {
                html += '<div style="margin-top:24px; text-align:center;">';
                html += '<a href="' + data.buyLink + '" target="_blank" class="btn-star pointer-events-auto">';
                html += '<div class="btn-star-inner"><div class="btn-star-content"><div class="btn-star-text">Buy This Skill — $50</div></div></div>';
                html += '</a>';
                html += '</div>';
            }

            content.innerHTML = html;

            // Open panel
            panel.classList.add('agentic-open');
            activeAgenticCard = cardId;

            // Animate steps
            requestAnimationFrame(function() {
                animateAgenticSteps();
            });

            // Start pipeline simulation if present
            if (data.showPipeline) {
                setTimeout(function() {
                    if (typeof window.runPipelineSim === 'function') {
                        window.runPipelineSim();
                    }
                }, 300);
            }
        }

        function animateAgenticSteps() {
            var steps = document.querySelectorAll('#agentic-expand-content .agentic-step');
            steps.forEach(function(step, i) {
                setTimeout(function() {
                    step.classList.add('ag-visible');
                }, i * 120);
            });
        }

        // ── Skill Modal System ──
        function openSkillModal(cardId) {
            var data = AGENTIC_DATA[cardId];
            if (!data) return;

            document.getElementById('skillTitle').textContent = data.title;
            document.getElementById('skillSubtitle').textContent = 'How it works, step by step';

            var content = document.getElementById('skillModalContent');
            var canvas = document.createElement('div');
            canvas.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0;padding:8px 0;';

            // Strip FA prefix to get icon ID
            function iconId(icon) {
                return icon.replace('fa-solid fa-', 'icon-').replace('fa-brands fa-', 'icon-');
            }

            data.steps.forEach(function(step, i) {
                var el = document.createElement('div');
                el.className = 'fc-node';
                el.setAttribute('data-type', step.type);

                var badgeHtml = '<div class="fc-step-badge">' + (i + 1) + '</div>';
                var accentHtml = '<div class="fc-node-accent"></div>';
                var iconHtml = '<div class="fc-node-icon"><svg class="icon"><use href="#' + iconId(step.icon) + '"/></svg></div>';
                var descHtml = '<div class="fc-node-desc">' + step.desc + '</div>';
                var textHtml = '<div class="fc-node-text"><div class="fc-node-label">' + step.label + '</div>' + descHtml + '</div>';

                el.innerHTML = badgeHtml + accentHtml + iconHtml + textHtml;
                canvas.appendChild(el);

                if (i < data.steps.length - 1) {
                    var conn = document.createElement('div');
                    conn.className = 'fc-connector';
                    conn.setAttribute('data-conn-idx', i);
                    canvas.appendChild(conn);
                }
            });

            // Videos section
            if (data.videos && data.videos.length) {
                var vHeading = data.videoHeading || 'Videos Created by This Pipeline';
                var vSub = data.videoSubheading || '';
                var videoSection = document.createElement('div');
                videoSection.style.marginTop = '24px';
                var vHtml = '<div class="fc-video-label">' + vHeading + '</div>';
                if (vSub) vHtml += '<p style="font-size:11px;color:rgba(17,17,17,0.5);margin:4px 0 12px;font-family:sans-serif;">' + vSub + '</p>';
                data.videos.forEach(function(v) {
                    vHtml += '<div style="margin-top:12px;">';
                    vHtml += '<video src="' + v.src + '" controls playsinline preload="none" style="width:100%;max-width:400px;border-radius:0;border:1px solid rgba(17,17,17,0.1);"></video>';
                    vHtml += '<div style="font-size:10px;font-family:\'DM Mono\',monospace;color:rgba(17,17,17,0.4);text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">' + v.label + '</div>';
                    vHtml += '</div>';
                });
                videoSection.innerHTML = vHtml;
                canvas.appendChild(videoSection);
            }

            // Buy button
            if (data.buyLink) {
                var buyDiv = document.createElement('div');
                buyDiv.style.cssText = 'margin-top:24px; text-align:center; padding-bottom:8px;';
                buyDiv.innerHTML = '<a href="' + data.buyLink + '" target="_blank" class="btn-star pointer-events-auto"><div class="btn-star-inner"><div class="btn-star-content"><div class="btn-star-text">Buy This Skill — $50</div></div></div></a>';
                canvas.appendChild(buyDiv);
            }

            content.innerHTML = '';
            content.appendChild(canvas);

            document.getElementById('skillBackdrop').classList.add('fc-open');
            document.getElementById('skillModal').classList.add('fc-open');
            document.body.style.overflow = 'hidden';

            // Animate nodes
            requestAnimationFrame(function() {
                var nodes = content.querySelectorAll('.fc-node');
                var connectors = content.querySelectorAll('.fc-connector');
                nodes.forEach(function(node, i) {
                    setTimeout(function() {
                        node.classList.add('fc-visible');
                        if (i < connectors.length) {
                            setTimeout(function() {
                                connectors[i].classList.add('fc-conn-visible');
                            }, 200);
                        }
                    }, i * 300);
                });
            });

            // Start pipeline simulation if present
            if (data.showPipeline) {
                setTimeout(function() {
                    if (typeof window.runPipelineSim === 'function') {
                        window.runPipelineSim();
                    }
                }, 300);
            }
        }

        function closeSkillModal() {
            document.getElementById('skillBackdrop').classList.remove('fc-open');
            document.getElementById('skillModal').classList.remove('fc-open');
            document.body.style.overflow = '';
            if (typeof window.stopPipelineSim === 'function') window.stopPipelineSim();
        }

        // Agentic card click handlers — open skill modal instead of inline expand
        document.querySelectorAll('.agentic-card[data-agentic]').forEach(function(card) {
            card.addEventListener('click', function() {
                openSkillModal(this.dataset.agentic);
            });
        });

        // ── Flowchart Renderer (Vertical Pipeline) ──
        function renderFlowchart(automationId) {
            const data = FLOWCHART_DATA[automationId];
            if (!data) return;
            const canvas = document.getElementById('flowchartCanvas');
            canvas.innerHTML = '';

            const nodes = data.nodes;

            nodes.forEach(function(node, i) {
                // Create node element
                var el = document.createElement('div');
                el.className = 'fc-node';
                el.id = 'fc-' + node.id;
                el.setAttribute('data-type', node.type);

                var badgeHtml = '<div class="fc-step-badge">' + (i + 1) + '</div>';
                var accentHtml = '<div class="fc-node-accent"></div>';
                var iconHtml = '<div class="fc-node-icon"><i class="' + node.icon + '"></i></div>';
                var descHtml = node.desc ? '<div class="fc-node-desc">' + node.desc + '</div>' : '';
                var textHtml = '<div class="fc-node-text"><div class="fc-node-label">' + node.label + '</div>' + descHtml + '</div>';

                el.innerHTML = badgeHtml + accentHtml + iconHtml + textHtml;
                canvas.appendChild(el);

                // Add connector between nodes (not after last node)
                if (i < nodes.length - 1) {
                    var conn = document.createElement('div');
                    conn.className = 'fc-connector';
                    conn.setAttribute('data-conn-idx', i);
                    canvas.appendChild(conn);
                }
            });

            // Append video if available
            if (data.videoSrc) {
                var videoSection = document.createElement('div');
                videoSection.innerHTML =
                    '<div class="fc-video-label">See it in action</div>' +
                    '<video src="' + data.videoSrc + '" controls playsinline preload="none"></video>';
                canvas.appendChild(videoSection);
            }

            // Trigger animation after DOM paint
            requestAnimationFrame(function() {
                playFlowchartAnimation();
            });
        }

        // ── Flowchart Animation (Vertical Pipeline) ──
        function playFlowchartAnimation() {
            var canvas = document.getElementById('flowchartCanvas');
            var nodes = canvas.querySelectorAll('.fc-node');
            var connectors = canvas.querySelectorAll('.fc-connector');

            nodes.forEach(function(node, i) {
                setTimeout(function() {
                    node.classList.add('fc-visible');

                    // Show connector 200ms after node appears
                    if (connectors[i]) {
                        setTimeout(function() {
                            connectors[i].classList.add('fc-conn-visible');
                        }, 200);
                    }

                    // Glow on final node
                    if (i === nodes.length - 1) {
                        setTimeout(function() { node.classList.add('fc-glow'); }, 600);
                    }
                }, i * 350);
            });
        }

        // Workflow step progress animation
        const workflowCard = document.querySelector('.workflow-steps');
        if (workflowCard) {
            const stepObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate');
                        stepObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            stepObserver.observe(workflowCard);
        }

        // ═══════════════════════════════════════════════════════════
        // PIPELINE SIMULATION ENGINE
        // ═══════════════════════════════════════════════════════════
        (function() {
            const SIM = {
                isRunning: false,
                timerInterval: null,
                startTime: 0,
                timeouts: [],
                hasPlayed: false,
            };

            // Agent colors for log
            const AGENT_COLORS = { researcher: 'researcher', designer: 'designer', judge: 'judge', ops: 'ops', system: 'system' };

            // Timeline: [delayMs, action]
            // Each action is { agent, status, task, completedTask, log }
            const TIMELINE = [
                // === RESEARCHER PHASE (0-10s) ===
                [0,    { agent: 'researcher', status: 'working', task: 'Scraping website...', log: { agent: 'researcher', msg: 'Starting research for ACME Plumbing' } }],
                [1500, { agent: 'researcher', status: 'working', task: 'Scraping website...', completedTask: null, log: { agent: 'researcher', msg: 'Website scraped — 5 pages captured' } }],
                [2500, { agent: 'researcher', status: 'working', task: 'Scraping Google reviews...', completedTask: 'Website scraped', log: { agent: 'researcher', msg: 'Scraping Google reviews...' } }],
                [4500, { agent: 'researcher', status: 'working', task: 'Running AI analysis...', completedTask: 'Reviews scraped (12 found)', log: { agent: 'researcher', msg: '12 Google reviews scraped' } }],
                [6500, { agent: 'researcher', status: 'working', task: 'Combining research data...', completedTask: 'AI analysis complete', log: { agent: 'researcher', msg: 'Pain points identified: outdated site, no online booking' } }],
                [8000, { agent: 'researcher', status: 'working', task: 'Screenshotting old site...', completedTask: 'Research combined', log: { agent: 'researcher', msg: 'Combining research data...' } }],
                [9500, { agent: 'researcher', status: 'done', task: '', completedTask: 'Old site screenshot', log: { agent: 'researcher', msg: 'Research phase complete ✓' } }],

                // === DESIGNER PHASE (10-19s) ===
                [10000, { agent: 'designer', status: 'working', task: 'Generating hero section...', log: { agent: 'designer', msg: 'Starting spec site generation' } }],
                [12000, { agent: 'designer', status: 'working', task: 'Building services section...', completedTask: 'Hero section generated', log: { agent: 'designer', msg: 'Hero section with emergency CTA generated' } }],
                [14500, { agent: 'designer', status: 'working', task: 'Building testimonials...', completedTask: 'Services section built', log: { agent: 'designer', msg: 'Services & pricing section built' } }],
                [16500, { agent: 'designer', status: 'working', task: 'Generating footer + CSS...', completedTask: 'Testimonials section built', log: { agent: 'designer', msg: 'Testimonial section with real reviews' } }],
                [18500, { agent: 'designer', status: 'done', task: '', completedTask: 'Full HTML generated', log: { agent: 'designer', msg: 'Design phase complete ✓' } }],

                // === JUDGE PHASE (19-26s) ===
                [19500, { agent: 'judge', status: 'working', task: 'Screenshotting new site...', log: { agent: 'judge', msg: 'Starting quality evaluation' } }],
                [21000, { agent: 'judge', status: 'working', task: 'Evaluating structure...', completedTask: 'New site screenshot', log: { agent: 'judge', msg: 'Screenshot captured for review' } }],
                [23000, { agent: 'judge', status: 'working', task: 'Visual review scoring...', completedTask: 'Structure score: 85/100', log: { agent: 'judge', msg: 'Structure score: 85/100 — all sections present' } }],
                [25000, { agent: 'judge', status: 'done', task: '', completedTask: 'Visual score: 91/100 — APPROVED', log: { agent: 'judge', msg: 'Visual score: 91/100 — APPROVED ✓' } }],

                // === OPS PHASE (26-34s) ===
                [26000, { agent: 'ops', status: 'working', task: 'Deploying to Netlify...', log: { agent: 'ops', msg: 'Starting deployment' } }],
                [29000, { agent: 'ops', status: 'working', task: 'Generating outreach email...', completedTask: 'Deployed → acme-plumbing.netlify.app', log: { agent: 'ops', msg: 'Site deployed to Netlify ✓' } }],
                [31500, { agent: 'ops', status: 'working', task: 'Creating follow-up sequence...', completedTask: 'Outreach email drafted', log: { agent: 'ops', msg: 'Personalized outreach email generated' } }],
                [33500, { agent: 'ops', status: 'done', task: '', completedTask: 'Follow-ups scheduled (4 touches)', log: { agent: 'ops', msg: 'Follow-up sequence created — 4 touches' } }],

                // === COMPLETE (34s) ===
                [34000, { log: { agent: 'system', msg: 'Pipeline complete! Site deployed + email sent.' }, showOutput: true }],
            ];

            function resetSim() {
                // Clear all pending timeouts
                SIM.timeouts.forEach(t => clearTimeout(t));
                SIM.timeouts = [];
                if (SIM.timerInterval) clearInterval(SIM.timerInterval);

                // Reset agent cards
                ['researcher', 'designer', 'judge', 'ops'].forEach(agent => {
                    const card = document.getElementById('sim-' + agent);
                    const badge = document.getElementById('sim-' + agent + '-badge');
                    const task = document.getElementById('sim-' + agent + '-task');
                    const completed = document.getElementById('sim-' + agent + '-completed');
                    if (card) { card.className = 'sim-agent-card idle'; }
                    if (badge) { badge.className = 'sim-badge idle'; badge.textContent = 'Idle'; }
                    if (task) { task.className = 'sim-agent-task'; task.innerHTML = getDefaultTask(agent); }
                    if (completed) { completed.innerHTML = ''; }
                });

                // Reset log
                const log = document.getElementById('sim-log');
                if (log) log.innerHTML = '<div class="log-title">Activity Log</div>';

                // Reset output bar
                const output = document.getElementById('sim-output-bar');
                if (output) output.classList.remove('visible');

                // Reset timer
                const timer = document.getElementById('sim-timer');
                if (timer) timer.textContent = '00:00';
            }

            function getDefaultTask(agent) {
                const defaults = { researcher: 'Waiting for lead...', designer: 'Waiting for research...', judge: 'Waiting for site...', ops: 'Waiting for approval...' };
                return defaults[agent] || '';
            }

            function setAgentState(agent, status, taskText, completedTask) {
                const card = document.getElementById('sim-' + agent);
                const badge = document.getElementById('sim-' + agent + '-badge');
                const taskEl = document.getElementById('sim-' + agent + '-task');
                const completedEl = document.getElementById('sim-' + agent + '-completed');

                if (card) {
                    card.className = 'sim-agent-card ' + status;
                }
                if (badge) {
                    badge.className = 'sim-badge ' + status;
                    badge.textContent = status === 'working' ? 'Working' : status === 'done' ? 'Done' : 'Idle';
                }
                if (taskEl) {
                    taskEl.className = 'sim-agent-task' + (status === 'working' ? ' active' : '');
                    if (status === 'working' && taskText) {
                        taskEl.innerHTML = taskText + '<span class="sim-typing-cursor"></span>';
                    } else if (status === 'done') {
                        taskEl.innerHTML = '<span style="color:#34C759;">Complete</span>';
                    } else {
                        taskEl.textContent = taskText || getDefaultTask(agent);
                    }
                }
                if (completedTask && completedEl) {
                    const item = document.createElement('div');
                    item.className = 'sim-completed-item';
                    item.innerHTML = '<span class="check"><i class="fa-solid fa-check"></i></span> ' + completedTask;
                    completedEl.appendChild(item);
                    // Trigger animation
                    requestAnimationFrame(() => item.classList.add('visible'));
                }
            }

            function addLogEntry(agent, msg) {
                const log = document.getElementById('sim-log');
                if (!log) return;
                const elapsed = Math.floor((Date.now() - SIM.startTime) / 1000);
                const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const secs = String(elapsed % 60).padStart(2, '0');

                const entry = document.createElement('div');
                entry.className = 'sim-log-entry';
                entry.innerHTML = '<span class="log-time">' + mins + ':' + secs + '</span>' +
                    '<span class="log-agent ' + (AGENT_COLORS[agent] || 'system') + '">' + agent + '</span>' +
                    '<span class="log-msg">' + msg + '</span>';
                log.appendChild(entry);
                requestAnimationFrame(() => entry.classList.add('visible'));
                log.scrollTop = log.scrollHeight;
            }

            function startTimer() {
                SIM.startTime = Date.now();
                const timerEl = document.getElementById('sim-timer');
                SIM.timerInterval = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - SIM.startTime) / 1000);
                    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
                    const secs = String(elapsed % 60).padStart(2, '0');
                    if (timerEl) timerEl.textContent = mins + ':' + secs;
                }, 1000);
            }

            window.runPipelineSim = runSimulation;
            window.stopPipelineSim = function() {
                SIM.isRunning = false;
                SIM.timeouts.forEach(t => clearTimeout(t));
                SIM.timeouts = [];
                if (SIM.timerInterval) clearInterval(SIM.timerInterval);
            };
            function runSimulation() {
                if (SIM.isRunning) return;
                SIM.isRunning = true;
                resetSim();
                startTimer();

                TIMELINE.forEach(([delay, action]) => {
                    const t = setTimeout(() => {
                        if (action.agent && action.status) {
                            setAgentState(action.agent, action.status, action.task, action.completedTask);
                        }
                        if (action.log) {
                            addLogEntry(action.log.agent, action.log.msg);
                        }
                        if (action.showOutput) {
                            const output = document.getElementById('sim-output-bar');
                            if (output) output.classList.add('visible');
                        }
                    }, delay);
                    SIM.timeouts.push(t);
                });

                // Schedule loop restart (42s total = 34s animation + 5s pause + 3s reset)
                const loopTimeout = setTimeout(() => {
                    SIM.isRunning = false;
                    clearInterval(SIM.timerInterval);
                    // Pause 3s then restart
                    const restartTimeout = setTimeout(() => {
                        runSimulation();
                    }, 3000);
                    SIM.timeouts.push(restartTimeout);
                }, 37000);
                SIM.timeouts.push(loopTimeout);
            }

            // IntersectionObserver — auto-play when 30% visible
            const simEl = document.getElementById('pipeline-sim');
            if (simEl) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !SIM.isRunning) {
                            runSimulation();
                        }
                        if (!entry.isIntersecting && SIM.isRunning) {
                            // Pause when out of view
                            SIM.isRunning = false;
                            SIM.timeouts.forEach(t => clearTimeout(t));
                            SIM.timeouts = [];
                            if (SIM.timerInterval) clearInterval(SIM.timerInterval);
                        }
                    });
                }, { threshold: 0.3 });
                observer.observe(simEl);
            }
        })();

        // sim-trigger event — starts pipeline animation when agentic tab becomes visible
        window.addEventListener('sim-trigger', function() {
            const simEl = document.getElementById('pipeline-sim');
            if (simEl) {
                // Reset and replay
                const SIM_EVENT = new Event('sim-replay');
                simEl.dispatchEvent(SIM_EVENT);
            }
        });

        // Hash-based tab routing
        function handleHash() {
            const hash = window.location.hash;
            const map = {
                '#ai-automation': 'automation',
                '#voice-ai': 'voice',
                '#agentic-workflow': 'agentic'
            };
            if (map[hash]) {
                showServicesTab(map[hash]);
                setTimeout(() => {
                    document.getElementById('services-overview')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
        window.addEventListener('hashchange', handleHash);
        window.addEventListener('DOMContentLoaded', handleHash);

        // Quick Start Buttons -> Open Setup Form
        const triggerButtons = [
            'pain-try-demo',
            'calc-try-demo',
            'price-starter-demo',
            'price-growth-demo'
        ];

        triggerButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Show setup form first
                    window.dispatchEvent(new CustomEvent('start-demo', { detail: null }));
                });
            }
        });


// ── Let's Work Together Animation ──
    var lwtClicked = false;

    function lwtHandleClick() {
        if (lwtClicked) return;
        lwtClicked = true;

        // Fade out main heading + available badge + bottom text
        var main = document.getElementById('lwt-main');
        var available = document.getElementById('lwt-available');
        var bottom = document.getElementById('lwt-bottom');
        var heading = document.getElementById('lwt-heading');

        heading.style.opacity = '0';
        heading.style.transform = 'translateY(-40px) scale(0.95)';
        main.style.pointerEvents = 'none';

        // Circle explodes with red
        var circle = document.getElementById('lwt-circle');
        circle.style.background = '#E63B2E';
        circle.style.borderColor = '#E63B2E';
        circle.style.transform = 'scale(3)';
        circle.style.opacity = '0';
        circle.style.transitionDuration = '700ms';

        // Arrow flies away
        var arrow = document.getElementById('lwt-arrow');
        arrow.style.transform = 'translate(100px, -100px) scale(0.5)';
        arrow.style.opacity = '0';
        arrow.style.transitionDuration = '600ms';

        // Side lines
        document.getElementById('lwt-left-line').style.transform = 'scaleX(0) translateX(-20px)';
        document.getElementById('lwt-left-line').style.opacity = '0';
        document.getElementById('lwt-right-line').style.transform = 'scaleX(0) translateX(20px)';
        document.getElementById('lwt-right-line').style.opacity = '0';

        available.style.opacity = '0';
        available.style.transform = 'translateY(-20px)';
        bottom.style.opacity = '0';
        bottom.style.transform = 'translateY(20px)';
        bottom.style.pointerEvents = 'none';

        // Show success state after 500ms
        setTimeout(function() {
            var success = document.getElementById('lwt-success');
            success.style.opacity = '1';
            success.style.transform = 'translateY(0) scale(1)';
            success.style.pointerEvents = 'auto';

            // Stagger the inner elements
            document.getElementById('lwt-perfect').style.transform = 'translateY(0)';
            document.getElementById('lwt-perfect').style.opacity = '1';
            document.getElementById('lwt-letstalk').style.transform = 'translateY(0)';
            document.getElementById('lwt-letstalk').style.opacity = '1';

            var btn = document.getElementById('lwt-book-btn');
            btn.style.transform = 'translateY(0)';
            btn.style.opacity = '1';

            document.getElementById('lwt-subtext').style.transform = 'translateY(0)';
            document.getElementById('lwt-subtext').style.opacity = '1';
        }, 500);
    }

    function lwtRevealCal() {
        // Fade out the overlay
        var overlay = document.getElementById('lwt-overlay');
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateY(-30px)';
        overlay.style.pointerEvents = 'none';

        // Reveal the Cal.com embed
        setTimeout(function() {
            overlay.style.display = 'none';
            var cal = document.getElementById('lwt-cal-container');
            cal.style.opacity = '1';
            cal.style.transform = 'translateY(0)';
            cal.style.pointerEvents = 'auto';
        }, 400);
    }


// ── Floating Icon Mouse Repulsion ──
    (function() {
        var floatingIcons = document.querySelectorAll('.floating-icon');
        var iconStates = [];

        // Store original positions and animation names
        floatingIcons.forEach(function(icon) {
            iconStates.push({
                el: icon,
                anim: window.getComputedStyle(icon).animationName,
                repelled: false,
                timeout: null
            });
        });

        document.addEventListener('mousemove', function(e) {
            floatingIcons.forEach(function(icon, i) {
                var rect = icon.getBoundingClientRect();
                var iconX = rect.left + rect.width / 2;
                var iconY = rect.top + rect.height / 2;
                var dx = e.clientX - iconX;
                var dy = e.clientY - iconY;
                var distance = Math.sqrt(dx * dx + dy * dy);
                var state = iconStates[i];

                if (distance < 150) {
                    var angle = Math.atan2(dy, dx);
                    var force = (1 - distance / 150) * 45;
                    var tx = -Math.cos(angle) * force;
                    var ty = -Math.sin(angle) * force;
                    // Pause CSS animation and apply repulsion
                    icon.style.animationPlayState = 'paused';
                    icon.style.transform = 'translate(' + tx + 'px, ' + ty + 'px)';
                    state.repelled = true;
                    // Clear any pending resume
                    if (state.timeout) { clearTimeout(state.timeout); state.timeout = null; }
                } else if (state.repelled) {
                    // Resume CSS animation after mouse moves away
                    if (!state.timeout) {
                        state.timeout = setTimeout(function() {
                            icon.style.transform = '';
                            icon.style.animationPlayState = '';
                            state.repelled = false;
                            state.timeout = null;
                        }, 300);
                    }
                }
            });
        });
    })();
