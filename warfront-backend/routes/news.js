const express = require('express');
const router = express.Router();
const { fetchNewsAPI } = require('../services/newsService');
const { fetchNews } = require('../services/redditService');

router.get('/', async (req, res) => {
  try {
    const { limit = 30, source = 'all' } = req.query;
    let articles = [];

    if (source === 'all' || source === 'newsapi') {
      const apiNews = await fetchNewsAPI();
      articles.push(...apiNews);
    }

    if (source === 'all' || source === 'reddit') {
      const redditNews = await fetchNews();
      const formatted = redditNews.map(r => ({
        id: r.id,
        title: r.title,
        source: `r/${r.subreddit}`,
        label: r.label,
        priority: r.priority,
        description: r.selftext,
        url: r.permalink,
        externalUrl: r.url,
        thumbnail: r.thumbnail,
        publishedAt: new Date(r.createdUtc * 1000).toISOString(),
        upvotes: r.upvotes,
        comments: r.comments,
        flair: r.flair,
        type: 'reddit'
      }));
      articles.push(...formatted);
    }

    articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    res.json({ success: true, count: articles.slice(0, Number(limit)).length, data: articles.slice(0, Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
