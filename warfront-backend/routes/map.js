const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../utils/cache');

// GDELT event codes for conflict-related events
// https://www.gdeltproject.org/data/documentation/CAMEO.Manual.GDELT.pdf
const CONFLICT_CODES = ['13','14','15','16','17','18','19','20'];

// GET /api/map
// Returns recent conflict events from GDELT
router.get('/', async (req, res) => {
  try {
    const cached = cache.get('gdelt:events');
    if (cached) return res.json({ success: true, cached: true, data: cached });

    // GDELT GKG last 24h conflict events — CSV format
    const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=war+OR+conflict+OR+attack+OR+airstrike+OR+shelling+OR+missile+OR+troops&mode=pointdata&maxpoints=200&format=json&timespan=24h`;

    const response = await axios.get(url, { timeout: 15000 });
    const raw = response.data;

    if (!raw.features || !raw.features.length) {
      return res.json({ success: true, cached: false, data: [] });
    }

    // Parse and clean features
    const events = raw.features
      .filter(f => f.geometry?.coordinates?.length === 2)
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        title: f.properties?.name || f.properties?.title || 'Conflict Event',
        url: f.properties?.url || null,
        date: f.properties?.dateadded || null,
        tone: f.properties?.tone || 0,
        type: getToneType(f.properties?.tone || 0),
      }))
      .filter(e => e.lat && e.lng && Math.abs(e.lat) < 90 && Math.abs(e.lng) < 180);

    cache.set('gdelt:events', events, 900); // cache 15 min
    console.log(`[GDELT] Fetched ${events.length} conflict events`);
    res.json({ success: true, cached: false, count: events.length, data: events });

  } catch (err) {
    console.error('[Map /gdelt]', err.message);
    // Fallback to known active conflict zones if GDELT fails
    const fallback = getFallbackZones();
    res.json({ success: true, cached: false, fallback: true, data: fallback });
  }
});

// Tone score → event type
function getToneType(tone) {
  if (tone < -10) return 'critical';
  if (tone < -5) return 'conflict';
  if (tone < 0) return 'tension';
  return 'monitor';
}

// Static fallback zones if GDELT is unreachable
function getFallbackZones() {
  return [
    { id:'ukr1', lat:48.0, lng:37.8, title:'Donetsk Front', type:'critical', url:null },
    { id:'ukr2', lat:47.8, lng:35.2, title:'Zaporizhzhia', type:'conflict', url:null },
    { id:'ukr3', lat:49.9, lng:36.3, title:'Kharkiv', type:'conflict', url:null },
    { id:'ukr4', lat:46.5, lng:32.6, title:'Kherson', type:'tension', url:null },
    { id:'ukr5', lat:48.5, lng:39.3, title:'Luhansk', type:'critical', url:null },
    { id:'gaz1', lat:31.4, lng:34.3, title:'Gaza Strip', type:'critical', url:null },
    { id:'gaz2', lat:31.8, lng:35.2, title:'West Bank', type:'conflict', url:null },
    { id:'leb1', lat:33.5, lng:35.5, title:'Southern Lebanon', type:'tension', url:null },
    { id:'syr1', lat:36.2, lng:37.1, title:'Northern Syria', type:'conflict', url:null },
    { id:'syr2', lat:34.8, lng:38.9, title:'Eastern Syria', type:'tension', url:null },
    { id:'sud1', lat:15.5, lng:32.5, title:'Khartoum, Sudan', type:'critical', url:null },
    { id:'mya1', lat:19.7, lng:96.1, title:'Myanmar Civil War', type:'conflict', url:null },
    { id:'eth1', lat:13.5, lng:39.5, title:'Tigray, Ethiopia', type:'tension', url:null },
    { id:'yem1', lat:15.3, lng:44.2, title:'Yemen', type:'conflict', url:null },
    { id:'mal1', lat:14.0, lng:-2.0, title:'Mali / Sahel', type:'tension', url:null },
    { id:'som1', lat:2.0, lng:45.3, title:'Somalia', type:'conflict', url:null },
    { id:'hti1', lat:18.5, lng:-72.3, title:'Haiti', type:'tension', url:null },
    { id:'pak1', lat:33.6, lng:73.0, title:'Pakistan-Afghanistan Border', type:'tension', url:null },
  ];
}

module.exports = router;
