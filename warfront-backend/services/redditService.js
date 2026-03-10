const axios = require('axios');
const cache = require('../utils/cache');

// ── SUBREDDIT CONFIG ──
const VIDEO_SOURCES = [
  { sub: 'CombatFootage', label: 'Combat Footage', priority: 'primary' },
];

const NEWS_SOURCES = [
  { sub: 'geopolitics', label: 'Geopolitics', priority: 'primary' },
  { sub: 'ukraine', label: 'Ukraine', priority: 'secondary' },
  { sub: 'worldnews', label: 'World News', priority: 'secondary' },
];

const HEADERS = {
  'User-Agent': 'WarfrontDashboard/1.0 (conflict intelligence aggregator)'
};

// ── FETCH A SINGLE SUBREDDIT ──
async function fetchSubreddit(subreddit, sort = 'hot', limit = 25) {
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
  const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
  return response.data.data.children.map(p => p.data);
}

// ── EXTRACT VIDEO POSTS ──
function extractVideos(posts, source) {
  return posts
    .filter(p =>
      p.is_video ||
      p.post_hint === 'hosted:video' ||
      (p.url && (p.url.includes('v.redd.it') || p.url.includes('reddit.com/r/')))
    )
    .map(p => ({
      id: p.id,
      title: p.title,
      subreddit: p.subreddit,
      label: source.label,
      priority: source.priority,
      videoUrl: p.media?.reddit_video?.fallback_url || null,
      hlsUrl: p.media?.reddit_video?.hls_url || null,
      thumbnail: p.thumbnail !== 'default' && p.thumbnail !== 'self' ? p.thumbnail : null,
      preview: p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') || null,
      upvotes: p.ups,
      upvoteRatio: p.upvote_ratio,
      comments: p.num_comments,
      author: p.author,
      createdUtc: p.created_utc,
      permalink: `https://reddit.com${p.permalink}`,
      flair: p.link_flair_text || null,
      nsfw: p.over_18,
      duration: p.media?.reddit_video?.duration || null,
    }));
}

// ── EXTRACT NEWS POSTS ──
function extractNews(posts, source) {
  return posts
    .filter(p => !p.is_video && p.title && p.score > 10)
    .map(p => ({
      id: p.id,
      title: p.title,
      subreddit: p.subreddit,
      label: source.label,
      priority: source.priority,
      url: p.url,
      selftext: p.selftext?.slice(0, 400) || null,
      thumbnail: p.thumbnail !== 'default' && p.thumbnail !== 'self' ? p.thumbnail : null,
      upvotes: p.ups,
      comments: p.num_comments,
      author: p.author,
      createdUtc: p.created_utc,
      permalink: `https://reddit.com${p.permalink}`,
      flair: p.link_flair_text || null,
      domain: p.domain,
    }));
}

// ── FETCH ALL VIDEOS ──
async function fetchVideos() {
  const cached = cache.get('reddit:videos');
  if (cached) return cached;

  const allVideos = [];
  for (const source of VIDEO_SOURCES) {
    try {
      const posts = await fetchSubreddit(source.sub, 'hot', 30);
      const videos = extractVideos(posts, source);
      allVideos.push(...videos);
      console.log(`[Reddit] r/${source.sub}: ${videos.length} videos found`);
    } catch (err) {
      console.error(`[Reddit] Failed to fetch r/${source.sub}:`, err.message);
    }
  }

  // Sort: primary sources first, then by upvotes
  allVideos.sort((a, b) => {
    if (a.priority === 'primary' && b.priority !== 'primary') return -1;
    if (b.priority === 'primary' && a.priority !== 'primary') return 1;
    return b.upvotes - a.upvotes;
  });

  cache.set('reddit:videos', allVideos, 600); // cache 10 min
  return allVideos;
}

// ── FETCH ALL NEWS ──
async function fetchNews() {
  const cached = cache.get('reddit:news');
  if (cached) return cached;

  const allNews = [];
  for (const source of NEWS_SOURCES) {
    try {
      const posts = await fetchSubreddit(source.sub, 'hot', 25);
      const news = extractNews(posts, source);
      allNews.push(...news);
      console.log(`[Reddit] r/${source.sub}: ${news.length} news posts found`);
    } catch (err) {
      console.error(`[Reddit] Failed to fetch r/${source.sub}:`, err.message);
    }
  }

  // Sort: geopolitics first (primary), then by upvotes
  allNews.sort((a, b) => {
    if (a.priority === 'primary' && b.priority !== 'primary') return -1;
    if (b.priority === 'primary' && a.priority !== 'primary') return 1;
    return b.upvotes - a.upvotes;
  });

  cache.set('reddit:news', allNews, 600);
  return allNews;
}

// ── FETCH ALL (for cron job) ──
async function fetchAll() {
  cache.clear('reddit:videos');
  cache.clear('reddit:news');
  await Promise.all([fetchVideos(), fetchNews()]);
}

module.exports = { fetchVideos, fetchNews, fetchAll };
