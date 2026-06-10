// Vercel Serverless Function: Verify Stripe payment → Fetch skill from GitHub

import { applyCors, rateLimit, isValidEmail } from './_lib/guard.js';

// Stripe checkout session ids look like cs_live_... / cs_test_...
const SESSION_ID_RE = /^cs_[A-Za-z0-9_]{8,200}$/;

export default async function handler(req, res) {
  if (applyCors(req, res, 'GET, OPTIONS')) return;
  res.setHeader('Content-Type', 'application/json');
  // Paid content — never let a shared cache hold the response.
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  // Tight limit: legit buyers need 1-2 calls. This is what makes email
  // enumeration (guessing which emails purchased) impractical.
  if (rateLimit(req, res, { name: 'deliver', max: 5, windowMs: 600_000 })) return;

  const email = req.query?.email;
  const sessionId = req.query?.session_id;

  if (!email && !sessionId) {
    return res.status(400).json({ error: 'Provide email or session_id' });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (sessionId && !SESSION_ID_RE.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session id' });
  }

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!STRIPE_KEY || !GITHUB_TOKEN) {
    console.error('deliver-skill misconfigured: missing env vars');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const SKILL_MAP = {
    'prod_UECNtAf8UV40e8': { name: 'Motion Graphic Video', githubPath: 'motion-graphic/motion-graphic.md', installFilename: 'motion-graphic.md' },
    'prod_UECNOQAaZlnmMS': { name: 'Lead Generation Pipeline', githubPath: 'lead-gen/lead-gen.md', installFilename: 'lead-gen.md' },
  };

  try {
    // Step 1: Find paid session via Stripe
    let stripeUrl;
    if (sessionId) {
      stripeUrl = `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=line_items`;
    } else {
      stripeUrl = `https://api.stripe.com/v1/checkout/sessions?customer_details%5Bemail%5D=${encodeURIComponent(email)}&status=complete&limit=10&expand[]=data.line_items`;
    }

    const stripeRes = await fetch(stripeUrl, {
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
    });
    const stripeData = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('deliver-skill stripe error:', stripeData.error?.message);
      return res.status(403).json({ error: 'Could not verify payment' });
    }

    // Find ALL matching products
    const purchasedSkills = [];
    const seenProducts = new Set();
    const sessions = sessionId ? [stripeData] : (stripeData.data || []);

    for (const session of sessions) {
      if (session.payment_status !== 'paid') continue;
      const lineItems = session.line_items?.data || [];
      for (const item of lineItems) {
        const productId = item.price?.product;
        if (SKILL_MAP[productId] && !seenProducts.has(productId)) {
          seenProducts.add(productId);
          purchasedSkills.push(SKILL_MAP[productId]);
        }
      }
    }

    if (purchasedSkills.length === 0) {
      return res.status(403).json({ error: 'No paid purchase found. Make sure you used the same email you paid with.' });
    }

    // Step 2: Fetch all skill files from GitHub
    const skills = [];
    for (const skill of purchasedSkills) {
      const githubRes = await fetch(
        `https://api.github.com/repos/trdteddarwin-eng/Stripe-Tedca-website-/contents/${skill.githubPath}?ref=main`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'Tedca-Skill-Delivery',
          },
        }
      );

      if (githubRes.ok) {
        const skillContent = await githubRes.text();
        skills.push({
          skill_name: skill.name,
          install_filename: skill.installFilename,
          skill_content: skillContent,
        });
      }
    }

    if (skills.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch skill files' });
    }

    return res.status(200).json({ skills });

  } catch (err) {
    console.error('deliver-skill failed:', err);
    return res.status(500).json({ error: 'Delivery failed. Please try again.' });
  }
}
