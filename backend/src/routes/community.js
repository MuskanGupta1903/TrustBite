const express = require('express');
const { getCommunitySignal, getHotspots, getLocalStats } = require('../services/communityIntel');

const router = express.Router();

/**
 * GET /api/community/nearby
 * Get community reports near a location
 * Query params: lat, lng, radius (km, default 3), category
 */
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 3;
    const category = req.query.category || null;

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng are required.' });
    }

    const signal = await getCommunitySignal(lat, lng, radius, category);
    res.json(signal);
  } catch (err) {
    console.error('Community nearby error:', err);
    res.status(500).json({ error: 'Failed to fetch community data.' });
  }
});

/**
 * GET /api/community/hotspots
 * Get hotspot clusters for the map
 */
router.get('/hotspots', async (req, res) => {
  try {
    const hotspots = await getHotspots();
    res.json(hotspots);
  } catch (err) {
    console.error('Hotspot error:', err);
    res.status(500).json({ error: 'Failed to fetch hotspot data.' });
  }
});

/**
 * GET /api/community/stats
 * Get real-time statistics
 * Query params: locality
 */
router.get('/stats', async (req, res) => {
  try {
    const locality = req.query.locality || '';
    const stats = await getLocalStats(locality);
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
});

module.exports = router;
