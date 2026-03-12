require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const redditRoutes = require('./routes/reddit');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const cache = require('./utils/cache');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── ROUTES ──
app.use('/api/videos', redditRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/map', require('./routes/map'));
app.use('/api/economy', require('./routes/economy'));
app.use('/api/gti', require('./routes/gti'));
app.use('/api/flights', require('./routes/flights'));

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    time: new Date().toISOString(),
    cache: cache.stats()
  });
});

// ── AUTO-REFRESH CACHE EVERY 10 MINUTES ──
cron.schedule('*/10 * * * *', async () => {
  console.log('[CRON] Refreshing Reddit + News cache...');
  try {
    await require('./services/redditService').fetchAll();
    await require('./services/newsService').fetchAll();
    console.log('[CRON] Cache refreshed successfully');
  } catch (err) {
    console.error('[CRON] Refresh failed:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 WARFRONT Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Videos: http://localhost:${PORT}/api/videos`);
  console.log(`   News:   http://localhost:${PORT}/api/news\n`);
});
