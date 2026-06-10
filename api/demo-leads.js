// Vercel Serverless Function: Demo lead gen pipeline (Apify + AnyMailFinder)

import { applyCors, rateLimit, isValidEmail } from './_lib/guard.js';

export const config = { maxDuration: 60 };

// Letters (any language), digits, spaces, and basic punctuation people type
// into "industry" / "location" — blocks URLs, injection junk, and oversized blobs.
const SEARCH_TERM_RE = /^[\p{L}\p{N}\s&.,'’()/\-]{2,80}$/u;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // This endpoint spends real money (Apify run + AnyMailFinder credits) on a
  // cache miss, so it gets the strictest per-IP limits of the whole API.
  if (rateLimit(req, res, { name: 'leads', max: 3, windowMs: 60_000 })) return;
  if (rateLimit(req, res, { name: 'leads-hour', max: 10, windowMs: 3_600_000 })) return;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  const ANYMAILFINDER_API_KEY = process.env.ANYMAILFINDER_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY || !APIFY_API_TOKEN || !ANYMAILFINDER_API_KEY) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const industry = typeof body.industry === 'string' ? body.industry.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';

    if (!email || !industry || !location) {
      return res.status(400).json({ error: 'Missing required fields: email, industry, location' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!SEARCH_TERM_RE.test(industry) || !SEARCH_TERM_RE.test(location)) {
      return res.status(400).json({ error: 'Invalid industry or location' });
    }

    // 1. DEMO ACCESS CHECK — the email must have been registered through
    // /api/store-demo-email first. Without this gate, any unregistered email
    // (0 rows) would pass straight through to a paid Apify run.
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_users?email=eq.${encodeURIComponent(email)}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!countRes.ok) {
      return res.status(500).json({ error: 'Failed to verify demo access' });
    }

    const rows = await countRes.json();
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Please start the demo from the demo page first.' });
    }
    if (rows.length > 3) {
      return res.status(403).json({ error: 'Demo limit reached for this email' });
    }

    // 2. CHECK CACHE FIRST
    const searchKey = `${industry.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
    const supaHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    };

    const cacheRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_cache?search_key=eq.${encodeURIComponent(searchKey)}&select=leads,total_scraped,ceos_found`,
      { headers: supaHeaders }
    );

    if (cacheRes.ok) {
      const cacheRows = await cacheRes.json();
      if (cacheRows.length > 0) {
        const cached = cacheRows[0];
        return res.status(200).json({
          leads: cached.leads,
          total_scraped: cached.total_scraped,
          ceos_found: cached.ceos_found,
          cached: true,
        });
      }
    }

    // 3. APIFY GOOGLE MAPS SCRAPE (cache miss)
    const searchQuery = `${industry} in ${location}`;

    const apifyRunRes = await fetch(
      'https://api.apify.com/v2/acts/compass~crawler-google-places/runs',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchStringsArray: [searchQuery],
          maxCrawledPlacesPerSearch: 10,
          language: 'en',
          includeWebResults: false,
        }),
      }
    );

    if (!apifyRunRes.ok) {
      const errText = await apifyRunRes.text();
      console.error('Apify run failed:', errText.slice(0, 500));
      return res.status(500).json({ error: 'Failed to start search. Please try again.' });
    }

    const apifyRun = await apifyRunRes.json();
    const runId = apifyRun.data?.id;

    if (!runId) {
      return res.status(500).json({ error: 'Failed to start Apify run' });
    }

    // Poll for completion (every 3s, timeout 90s)
    const startTime = Date.now();
    const TIMEOUT_MS = 40000;
    let runStatus = '';

    while (Date.now() - startTime < TIMEOUT_MS) {
      await new Promise(r => setTimeout(r, 3000));

      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        {
          headers: { 'Authorization': `Bearer ${APIFY_API_TOKEN}` },
        }
      );

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        runStatus = statusData.data?.status;
        if (runStatus === 'SUCCEEDED') break;
        if (runStatus === 'FAILED' || runStatus === 'ABORTED') {
          return res.status(500).json({ error: 'Search failed. Try a different industry or location.' });
        }
      }
    }

    if (runStatus !== 'SUCCEEDED') {
      return res.status(504).json({ error: 'Search took too long. Try a more specific location.' });
    }

    // Get results
    const datasetRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
      {
        headers: { 'Authorization': `Bearer ${APIFY_API_TOKEN}` },
      }
    );

    if (!datasetRes.ok) {
      return res.status(500).json({ error: 'Failed to retrieve search results' });
    }

    const places = await datasetRes.json();

    if (!places || places.length === 0) {
      return res.status(200).json({ error: 'No businesses found. Try a different industry or location.', leads: [], total_scraped: 0, ceos_found: 0 });
    }

    // 3. ANYMAILFINDER ENRICHMENT
    // Filter to businesses with websites
    const withWebsites = places.filter(p => p.website);
    const leads = [];
    let amfCalls = 0;
    const MAX_AMF_CALLS = 8;
    const TARGET_CEOS = 3;

    for (const place of withWebsites) {
      if (leads.length >= TARGET_CEOS || amfCalls >= MAX_AMF_CALLS) break;

      // Extract domain from website URL
      let domain;
      try {
        domain = new URL(place.website.startsWith('http') ? place.website : `https://${place.website}`).hostname;
        domain = domain.replace(/^www\./, '');
      } catch (e) {
        continue;
      }

      amfCalls++;

      try {
        const amfRes = await fetch(
          'https://api.anymailfinder.com/v5.0/search/company.json',
          {
            method: 'POST',
            headers: {
              'X-Api-Key': ANYMAILFINDER_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              domain,
              company_name: place.title || '',
            }),
          }
        );

        if (!amfRes.ok) continue;

        const amfData = await amfRes.json();
        const foundEmail = amfData.email;
        if (!foundEmail) continue;

        leads.push({
          business_name: place.title || '',
          phone: place.phone || '',
          website: domain,
          rating: place.totalScore || null,
          reviews: place.reviewsCount || 0,
          ceo_name: [amfData.first_name, amfData.last_name].filter(Boolean).join(' ') || '',
          ceo_email: foundEmail,
        });
      } catch (e) {
        // Skip failed enrichment, continue to next
        continue;
      }
    }

    // 4. UPDATE SUPABASE — log industry/location/results for this demo
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/demo_users?email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            industry,
            location,
            leads_found: leads.length,
          }),
        }
      );
    } catch (e) {
      // Non-critical — don't fail the request
    }

    // 5. SAVE TO CACHE (so the same search is free next time)
    if (leads.length > 0) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/demo_cache`, {
          method: 'POST',
          headers: {
            ...supaHeaders,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            search_key: searchKey,
            industry,
            location,
            leads,
            total_scraped: places.length,
            ceos_found: leads.length,
          }),
        });
      } catch (e) {
        // Cache write failed — non-critical
      }
    }

    // 6. RETURN RESULTS
    return res.status(200).json({
      leads,
      total_scraped: places.length,
      ceos_found: leads.length,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
