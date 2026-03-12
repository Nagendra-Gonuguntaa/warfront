const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../utils/cache');

// ── CONFLICT ZONE BOUNDING BOXES ──
// [minLat, maxLat, minLng, maxLng]
const CONFLICT_ZONES = [
  { name: 'Ukraine',      bbox: [44.0, 53.0, 22.0, 41.0] },
  { name: 'Middle East',  bbox: [12.0, 38.0, 28.0, 62.0] },
  { name: 'Sudan',        bbox: [8.0,  23.0, 21.0, 39.0] },
  { name: 'Sahel',        bbox: [10.0, 25.0, -8.0, 16.0] },
];

// ── FETCH FLIGHTS FROM OPENSKY ──
async function fetchZoneFlights(zone) {
  const [minLat, maxLat, minLng, maxLng] = zone.bbox;
  const url = `https://opensky-network.org/api/states/all?lamin=${minLat}&lamax=${maxLat}&lomin=${minLng}&lomax=${maxLng}`;

  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'WarfrontDashboard/1.0' }
    });

    if (!res.data?.states) return [];

    return res.data.states
      .filter(s => s[5] && s[6] && s[8] === false) // has position, not on ground
      .map(s => ({
        icao:      s[0],
        callsign:  s[1]?.trim() || 'Unknown',
        origin:    s[2] || 'Unknown',
        lat:       s[6],
        lng:       s[5],
        altitude:  s[7] ? Math.round(s[7]) : null,   // meters
        speed:     s[9] ? Math.round(s[9] * 3.6) : null, // m/s to km/h
        heading:   s[10] ? Math.round(s[10]) : null,
        zone:      zone.name,
      }));
  } catch (err) {
    console.warn(`[Flights] Failed to fetch ${zone.name}:`, err.message);
    return [];
  }
}

// ── GET /api/flights ──
router.get('/', async (req, res) => {
  try {
    const cached = cache.get('flights:live');
    if (cached) return res.json({ success: true, cached: true, data: cached });

    // Fetch all zones in parallel
    const results = await Promise.all(CONFLICT_ZONES.map(fetchZoneFlights));
    const allFlights = results.flat();

    // Deduplicate by ICAO
    const seen = new Set();
    const unique = allFlights.filter(f => {
      if (seen.has(f.icao)) return false;
      seen.add(f.icao);
      return true;
    });

    const data = {
      count: unique.length,
      zones: CONFLICT_ZONES.map((z, i) => ({
        name: z.name,
        count: results[i].length
      })),
      flights: unique,
      updatedAt: new Date().toISOString()
    };

    cache.set('flights:live', data, 60); // cache 60 seconds only — live data
    console.log(`[Flights] ${unique.length} live flights over conflict zones`);
    res.json({ success: true, cached: false, data });

  } catch (err) {
    console.error('[Flights]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
