const express = require('express');
const router = express.Router();
const cache = require('../utils/cache');

// GTI 2024 Data — Institute for Economics & Peace
// Source: visionofhumanity.org/maps/global-terrorism-index
// Score: 0 (no impact) to 10 (highest impact)
const GTI_2024 = [
  { rank:1,  country:'Burkina Faso',      code:'BF', score:9.02, change:+0.31, region:'Sub-Saharan Africa',  deaths:1907, trend:'up' },
  { rank:2,  country:'Mali',              code:'ML', score:8.74, change:+0.18, region:'Sub-Saharan Africa',  deaths:1329, trend:'up' },
  { rank:3,  country:'Syria',             code:'SY', score:8.65, change:-0.12, region:'Middle East & Africa',deaths:812,  trend:'down' },
  { rank:4,  country:'Somalia',           code:'SO', score:8.44, change:-0.09, region:'Sub-Saharan Africa',  deaths:1122, trend:'down' },
  { rank:5,  country:'Nigeria',           code:'NG', score:8.31, change:-0.22, region:'Sub-Saharan Africa',  deaths:1642, trend:'down' },
  { rank:6,  country:'Afghanistan',       code:'AF', score:8.11, change:-0.44, region:'South Asia',          deaths:745,  trend:'down' },
  { rank:7,  country:'Niger',             code:'NE', score:7.98, change:+0.55, region:'Sub-Saharan Africa',  deaths:634,  trend:'up' },
  { rank:8,  country:'Pakistan',          code:'PK', score:7.84, change:+0.31, region:'South Asia',          deaths:1523, trend:'up' },
  { rank:9,  country:'Myanmar',           code:'MM', score:7.61, change:+0.74, region:'Asia Pacific',        deaths:1832, trend:'up' },
  { rank:10, country:'Democratic Republic of Congo', code:'CD', score:7.58, change:+0.12, region:'Sub-Saharan Africa', deaths:982, trend:'up' },
  { rank:11, country:'Iraq',              code:'IQ', score:7.42, change:-0.18, region:'Middle East & Africa',deaths:532,  trend:'down' },
  { rank:12, country:'Sudan',             code:'SD', score:7.38, change:+1.21, region:'Sub-Saharan Africa',  deaths:2341, trend:'up' },
  { rank:13, country:'Mozambique',        code:'MZ', score:7.21, change:+0.08, region:'Sub-Saharan Africa',  deaths:421,  trend:'up' },
  { rank:14, country:'Ukraine',           code:'UA', score:7.11, change:+0.44, region:'Europe',              deaths:8823, trend:'up' },
  { rank:15, country:'Ethiopia',          code:'ET', score:6.98, change:-0.33, region:'Sub-Saharan Africa',  deaths:1243, trend:'down' },
  { rank:16, country:'India',             code:'IN', score:6.74, change:-0.11, region:'South Asia',          deaths:287,  trend:'down' },
  { rank:17, country:'Cameroon',          code:'CM', score:6.61, change:-0.05, region:'Sub-Saharan Africa',  deaths:312,  trend:'down' },
  { rank:18, country:'Colombia',          code:'CO', score:6.54, change:+0.09, region:'Latin America',       deaths:243,  trend:'up' },
  { rank:19, country:'Yemen',             code:'YE', score:6.48, change:-0.22, region:'Middle East & Africa',deaths:876,  trend:'down' },
  { rank:20, country:'Palestine',         code:'PS', score:6.41, change:+2.11, region:'Middle East & Africa',deaths:33175,trend:'up' },
  { rank:21, country:'Libya',             code:'LY', score:6.28, change:-0.14, region:'Middle East & Africa',deaths:234,  trend:'down' },
  { rank:22, country:'Chad',              code:'TD', score:6.18, change:+0.31, region:'Sub-Saharan Africa',  deaths:412,  trend:'up' },
  { rank:23, country:'Philippines',       code:'PH', score:5.98, change:-0.21, region:'Asia Pacific',        deaths:198,  trend:'down' },
  { rank:24, country:'Haiti',             code:'HT', score:5.87, change:+0.88, region:'Latin America',       deaths:4451, trend:'up' },
  { rank:25, country:'Mexico',            code:'MX', score:5.76, change:+0.12, region:'Latin America',       deaths:1543, trend:'up' },
];

// Lat/lng for map markers
const COORDS = {
  'BF':[12.3, -1.6], 'ML':[17.6, -4.0], 'SY':[35.0, 38.0], 'SO':[6.0, 46.2],
  'NG':[9.1, 8.7], 'AF':[33.9, 67.7], 'NE':[17.6, 8.1], 'PK':[30.4, 69.3],
  'MM':[19.2, 96.7], 'CD':[-4.0, 21.8], 'IQ':[33.2, 43.7], 'SD':[15.6, 32.5],
  'MZ':[-18.7, 35.5], 'UA':[49.0, 31.2], 'ET':[9.1, 40.5], 'IN':[20.6, 78.9],
  'CM':[3.9, 11.5], 'CO':[4.6, -74.3], 'YE':[15.6, 48.5], 'PS':[31.9, 35.2],
  'LY':[26.3, 17.2], 'TD':[15.5, 18.7], 'PH':[12.9, 121.8], 'HT':[18.9, -72.3],
  'MX':[23.6, -102.6],
};

// GET /api/gti
router.get('/', (req, res) => {
  const cached = cache.get('gti:data');
  if (cached) return res.json({ success: true, cached: true, data: cached });

  const data = {
    year: 2024,
    source: 'Institute for Economics & Peace',
    sourceUrl: 'https://www.visionofhumanity.org/maps/global-terrorism-index',
    totalCountriesAffected: 58,
    rankings: GTI_2024,
    mapPoints: GTI_2024.map(c => ({
      country: c.country,
      code: c.code,
      score: c.score,
      rank: c.rank,
      deaths: c.deaths,
      trend: c.trend,
      lat: COORDS[c.code]?.[0],
      lng: COORDS[c.code]?.[1],
    })).filter(p => p.lat && p.lng),
  };

  cache.set('gti:data', data, 86400); // cache 24hrs — data updates yearly
  res.json({ success: true, cached: false, data });
});

module.exports = router;
