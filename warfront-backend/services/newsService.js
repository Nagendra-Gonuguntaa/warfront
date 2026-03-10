const axios = require('axios');
const cache = require('../utils/cache');

const KEYWORDS = [
  'Ukraine war', 'Russia Ukraine', 'Gaza conflict',
  'Middle East war', 'Iran military', 'NATO conflict',
  'ceasefire', 'frontline', 'airstrike', 'war crimes'
];

// ── FETCH FROM NEWSAPI (free tier: 100 req/day) ──
async function fetchNewsAPI() {
  if (!process.env.NEWS_API_KEY) {
    console.warn('[NewsAPI] No API key set — skipping');
    return [];
  }

  const cached = cache.get('newsapi:headlines');
  if (cached) return cached;

  try {
    const query = 'Ukraine OR Gaza OR "Middle East" OR war OR conflict';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    const res = await axios.get(url, { timeout: 8000 });

    const articles = res.data.articles
      .filter(a => a.title && a.title !== '[Removed]')
      .map(a => ({
        id: Buffer.from(a.url).toString('base64').slice(0, 16),
        title: a.title,
        source: a.source.name,
        description: a.description,
        url: a.url,
        thumbnail: a.urlToImage,
        publishedAt: a.publishedAt,
        author: a.author,
        type: 'newsapi'
      }));

    cache.set('newsapi:headlines', articles, 900); // 15 min cache
    console.log(`[NewsAPI] Fetched ${articles.length} articles`);
    return articles;

  } catch (err) {
    console.error('[NewsAPI] Error:', err.message);
    return [];
  }
}

async function fetchAll() {
  cache.clear('newsapi:headlines');
  await fetchNewsAPI();
}

module.exports = { fetchNewsAPI, fetchAll };
