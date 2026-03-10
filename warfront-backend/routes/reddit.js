const express = require('express');
const router = express.Router();
const { fetchVideos, fetchNews } = require('../services/redditService');

router.get('/', async (req, res) => {
  try {
    const { limit = 20, nsfw = 'false' } = req.query;
    let videos = await fetchVideos();
    if (nsfw !== 'true') videos = videos.filter(v => !v.nsfw);
    res.json({ success: true, count: videos.slice(0, Number(limit)).length, total: videos.length, source: 'r/CombatFootage', data: videos.slice(0, Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/news', async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const news = await fetchNews();
    res.json({ success: true, count: news.slice(0, Number(limit)).length, sources: ['r/geopolitics', 'r/ukraine', 'r/worldnews'], data: news.slice(0, Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
