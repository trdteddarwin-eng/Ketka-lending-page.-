// Netlify Function: Verify Stripe payment → Fetch skill from GitHub → Return content
// Endpoint: /.netlify/functions/deliver-skill?session_id=cs_test_xxx

const https = require('https');

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
  });
}

// Map Stripe product IDs to GitHub skill file paths
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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const sessionId = event.queryStringParameters?.session_id;

  if (!sessionId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing session_id' }) };
  }

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!STRIPE_KEY || !GITHUB_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    // 1. Verify Stripe session is paid
    const stripeRes = await httpsGet(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=line_items`,
      { 'Authorization': `Bearer ${STRIPE_KEY}` }
    );

    if (stripeRes.status !== 200) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Invalid session' }) };
    }

    const session = JSON.parse(stripeRes.body);

    if (session.payment_status !== 'paid') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Payment not completed' }) };
    }

    // 2. Find which product was purchased
    const lineItems = session.line_items?.data || [];
    let skillInfo = null;

    for (const item of lineItems) {
      const productId = item.price?.product;
      if (SKILL_MAP[productId]) {
        skillInfo = SKILL_MAP[productId];
        break;
      }
    }

    if (!skillInfo) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'No matching skill found' }) };
    }

    // 3. Fetch skill file from private GitHub repo
    const githubRes = await httpsGet(
      `https://api.github.com/repos/trdteddarwin-eng/Stripe-Tedca-website-/contents/${skillInfo.githubPath}?ref=main`,
      {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'Tedca-Skill-Delivery',
      }
    );

    if (githubRes.status !== 200) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch skill file' }) };
    }

    // 4. Return everything the page needs
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        skill_name: skillInfo.name,
        install_filename: skillInfo.installFilename,
        skill_content: githubRes.body,
        customer_email: session.customer_details?.email || '',
      }),
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
