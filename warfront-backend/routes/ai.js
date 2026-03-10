const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../utils/cache');
const { fetchNews } = require('../services/redditService');
const { fetchNewsAPI } = require('../services/newsService');

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── HELPER: Call Groq ──
async function callGroq(systemPrompt, userMessage, maxTokens = 800) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set in .env');
  }
  const res = await axios.post(GROQ_API, {
    model: GROQ_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
  return res.data.choices[0].message.content;
}

// ── GET /api/ai/summary ──
router.get('/summary', async (req, res) => {
  try {
    const cached = cache.get('ai:summary');
    if (cached) return res.json({ success: true, cached: true, data: cached });

    const [redditNews, apiNews] = await Promise.all([fetchNews(), fetchNewsAPI()]);
    const headlines = [
      ...redditNews.slice(0, 8).map(n => `[${n.label}] ${n.title}`),
      ...apiNews.slice(0, 8).map(n => `[${n.source}] ${n.title}`)
    ].join('\n');

    const system = `You are a military intelligence analyst writing SITREPs for a conflict news dashboard.
Be factual, neutral, concise. Never speculate beyond what sources suggest.
Return ONLY valid JSON, no markdown, no backticks:
{ "summary": "2-sentence overview", "bullets": ["bullet1","bullet2","bullet3","bullet4"], "threatLevel": "LOW|MODERATE|HIGH|CRITICAL", "lastUpdated": "ISO string" }`;

    const text = await callGroq(system, `Write a SITREP based on:\n\n${headlines}\n\nDate: ${new Date().toUTCString()}`, 600);

    let data;
    try { data = JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch { data = { summary: text, bullets: [], threatLevel: 'UNKNOWN', lastUpdated: new Date().toISOString() }; }

    cache.set('ai:summary', data, 3600);
    res.json({ success: true, cached: false, data });
  } catch (err) {
    console.error('[AI /summary]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/ai/chat ──
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'message required' });

    const apiNews = await fetchNewsAPI();
    const context = apiNews.slice(0, 10).map(n => `- [${n.source}] ${n.title}`).join('\n');

    const system = `You are WARFRONT AI, a conflict intelligence assistant on a live war news dashboard.
Answer factually and neutrally. Keep responses to 3-5 sentences. Never take political sides.
Latest headlines:\n${context}\nDate: ${new Date().toUTCString()}`;

    const messages = [
      { role: 'system', content: system },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const groqRes = await axios.post(GROQ_API, {
      model: GROQ_MODEL, max_tokens: 500, messages, temperature: 0.7
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 30000
    });

    res.json({ success: true, reply: groqRes.data.choices[0].message.content });
  } catch (err) {
    console.error('[AI /chat]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/ai/factcheck ──
router.post('/factcheck', async (req, res) => {
  try {
    const { claim } = req.body;
    if (!claim) return res.status(400).json({ success: false, error: 'claim required' });

    const [redditNews, apiNews] = await Promise.all([fetchNews(), fetchNewsAPI()]);
    const context = [
      ...redditNews.slice(0, 8).map(n => `- ${n.title}`),
      ...apiNews.slice(0, 8).map(n => `- [${n.source}] ${n.title}`)
    ].join('\n');

    const system = `You are a fact-checking AI for a conflict news dashboard.
Return ONLY valid JSON, no markdown, no backticks:
{ "verdict": "LIKELY TRUE|UNVERIFIED|DISPUTED|FALSE", "confidence": "LOW|MEDIUM|HIGH", "reasoning": "2-3 sentences", "sources": ["source1","source2"] }`;

    const text = await callGroq(system, `Verify: "${claim}"\n\nHeadlines:\n${context}`, 400);

    let data;
    try { data = JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch { data = { verdict: 'UNVERIFIED', confidence: 'LOW', reasoning: text, sources: [] }; }

    res.json({ success: true, data });
  } catch (err) {
    console.error('[AI /factcheck]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
