// Vercel Serverless Function: Verify Stripe payment → Fetch skill from GitHub
// Endpoint: /api/deliver-skill?email=xxx OR ?session_id=xxx

const https = require('https');

function httpsRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
  });
}

const SKILL_MAP = {
  'prod_UAnq0IMPBItsO3': {
    name: 'Motion Graphic Video',
    githubPath: 'motion-graphic/motion-graphic.md',
    installFilename: 'motion-graphic.md',
  },
  'prod_UAnqybIz9QuOhF': {
    name: 'Research Agent',
    githubPath: 'research-agent/research-agent.md',
    installFilename: 'research-agent.md',
  },
};

async function findPaidSession(stripeKey, email) {
  const url = `https://api.stripe.com/v1/checkout/sessions?customer_details[email]=${encodeURIComponent(email)}&status=complete&limit=10`;
  const res = await httpsRequest(url, { 'Authorization': `Bearer ${stripeKey}` });
  if (res.status !== 200) return null;

  const sessions = JSON.parse(res.body);
  for (const session of sessions.data || []) {
    if (session.payment_status === 'paid') {
      const itemsRes = await httpsRequest(
        `https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items`,
        { 'Authorization': `Bearer ${stripeKey}` }
      );
      if (itemsRes.status === 200) {
        const items = JSON.parse(itemsRes.body);
        for (const item of items.data || []) {
          const productId = item.price?.product;
          if (SKILL_MAP[productId]) return { session, skillInfo: SKILL_MAP[productId] };
        }
      }
    }
  }
  return null;
}

async function verifyBySessionId(stripeKey, sessionId) {
  const res = await httpsRequest(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    { 'Authorization': `Bearer ${stripeKey}` }
  );
  if (res.status !== 200) return null;
  const session = JSON.parse(res.body);
  if (session.payment_status !== 'paid') return null;

  const itemsRes = await httpsRequest(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items`,
    { 'Authorization': `Bearer ${stripeKey}` }
  );
  if (itemsRes.status !== 200) return null;

  const items = JSON.parse(itemsRes.body);
  for (const item of items.data || []) {
    const productId = item.price?.product;
    if (SKILL_MAP[productId]) return { session, skillInfo: SKILL_MAP[productId] };
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { email, session_id } = req.query;

  if (!email && !session_id) {
    return res.status(400).json({ error: 'Provide email or session_id' });
  }

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!STRIPE_KEY || !GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    let result = null;
    if (session_id) {
      result = await verifyBySessionId(STRIPE_KEY, session_id);
    } else if (email) {
      result = await findPaidSession(STRIPE_KEY, email);
    }

    if (!result) {
      return res.status(403).json({ error: 'No paid purchase found. Make sure you used the same email you paid with.' });
    }

    const { skillInfo } = result;

    const githubRes = await httpsRequest(
      `https://api.github.com/repos/trdteddarwin-eng/Stripe-Tedca-website-/contents/${skillInfo.githubPath}?ref=main`,
      {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'Tedca-Skill-Delivery',
      }
    );

    if (githubRes.status !== 200) {
      return res.status(500).json({ error: 'Failed to fetch skill file' });
    }

    return res.status(200).json({
      skill_name: skillInfo.name,
      install_filename: skillInfo.installFilename,
      skill_content: githubRes.body,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
