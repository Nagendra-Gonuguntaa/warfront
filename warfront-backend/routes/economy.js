const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../utils/cache');

// ── WAR-SENSITIVE ASSETS ──
const ASSETS = [
  // Defense Stocks
  { ticker: 'LMT',  name: 'Lockheed Martin', category: 'defense',    reason: 'F-35, missiles, air defense systems' },
  { ticker: 'RTX',  name: 'Raytheon',        category: 'defense',    reason: 'Patriot missiles, Stinger, radar' },
  { ticker: 'NOC',  name: 'Northrop Grumman',category: 'defense',    reason: 'Drones, stealth bombers, cyber' },
  { ticker: 'GD',   name: 'General Dynamics', category: 'defense',   reason: 'Abrams tanks, Stryker vehicles' },
  { ticker: 'BA',   name: 'Boeing Defense',   category: 'defense',   reason: 'Apache helicopters, HIMARS' },
  // Commodities
  { ticker: 'BZ=F', name: 'Brent Crude Oil', category: 'commodity',  reason: 'Middle East conflict & sanctions' },
  { ticker: 'NG=F', name: 'Natural Gas',     category: 'commodity',  reason: 'Russia-Europe energy dependency' },
  { ticker: 'GC=F', name: 'Gold',            category: 'commodity',  reason: 'Safe haven during geopolitical risk' },
  { ticker: 'ZW=F', name: 'Wheat Futures',   category: 'commodity',  reason: 'Ukraine is world\'s breadbasket' },
  { ticker: 'CL=F', name: 'WTI Crude Oil',   category: 'commodity',  reason: 'Global oil supply disruptions' },
  // Currencies
  { ticker: 'RUB=X', name: 'USD/RUB',        category: 'currency',   reason: 'Russia sanctions impact' },
  { ticker: 'UAH=X', name: 'USD/UAH',        category: 'currency',   reason: 'Ukraine wartime economy' },
  { ticker: 'ILS=X', name: 'USD/ILS',        category: 'currency',   reason: 'Israel-Gaza conflict impact' },
  { ticker: 'CHF=X', name: 'USD/CHF',        category: 'currency',   reason: 'Swiss Franc — global safe haven' },
];

// ── FETCH SINGLE TICKER FROM YAHOO FINANCE ──
async function fetchTicker(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`;
    const res = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WarfrontDashboard/1.0)'
      }
    });

    const chart = res.data.chart.result?.[0];
    if (!chart) return null;

    const meta = chart.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const change = price - prevClose;
    const changePct = ((change / prevClose) * 100);

    return {
      ticker,
      price: parseFloat(price?.toFixed(2)),
      change: parseFloat(change?.toFixed(2)),
      changePct: parseFloat(changePct?.toFixed(2)),
      currency: meta.currency,
      marketState: meta.marketState,
    };
  } catch (err) {
    console.warn(`[Economy] Failed to fetch ${ticker}:`, err.message);
    return null;
  }
}

// ── GET /api/economy ──
router.get('/', async (req, res) => {
  try {
    const cached = cache.get('economy:prices');
    if (cached) return res.json({ success: true, cached: true, data: cached });

    // Fetch all tickers in parallel
    const results = await Promise.all(
      ASSETS.map(async asset => {
        const quote = await fetchTicker(asset.ticker);
        return {
          ...asset,
          price: quote?.price ?? null,
          change: quote?.change ?? null,
          changePct: quote?.changePct ?? null,
          currency: quote?.currency ?? 'USD',
          marketState: quote?.marketState ?? 'CLOSED',
        };
      })
    );

    const data = {
      defense:   results.filter(r => r.category === 'defense'),
      commodity: results.filter(r => r.category === 'commodity'),
      currency:  results.filter(r => r.category === 'currency'),
      updatedAt: new Date().toISOString(),
    };

    cache.set('economy:prices', data, 300); // cache 5 min
    console.log(`[Economy] Fetched ${results.length} assets`);
    res.json({ success: true, cached: false, data });

  } catch (err) {
    console.error('[Economy]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/economy/ai-brief ──
// AI analysis of how today's news affects these markets
router.get('/ai-brief', async (req, res) => {
  try {
    const cached = cache.get('economy:ai-brief');
    if (cached) return res.json({ success: true, cached: true, data: cached });

    const { fetchNewsAPI } = require('../services/newsService');
    const axios2 = require('axios');

    const news = await fetchNewsAPI();
    const headlines = news.slice(0, 10).map(n => `- ${n.title}`).join('\n');

    const system = `You are a war economy analyst. Based on conflict news headlines, briefly assess market impact.
Return ONLY valid JSON, no markdown:
{
  "summary": "2 sentence overall market assessment",
  "alerts": [
    { "asset": "asset name", "direction": "UP|DOWN|VOLATILE", "reason": "one sentence why" }
  ],
  "safeHavens": "one sentence on safe haven assets today",
  "disclaimer": "Not financial advice. For informational purposes only."
}
Limit alerts to 4 most relevant assets.`;

    const groqRes = await axios2.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Today's conflict headlines:\n${headlines}\n\nAssess market impact.` }
      ],
      temperature: 0.5
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const text = groqRes.data.choices[0].message.content;
    let data;
    try {
      data = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      data = { summary: text, alerts: [], safeHavens: '', disclaimer: 'Not financial advice.' };
    }

    cache.set('economy:ai-brief', data, 3600); // cache 1 hour
    res.json({ success: true, cached: false, data });

  } catch (err) {
    console.error('[Economy AI Brief]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
