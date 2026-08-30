const express = require('express');
const db = require('../db');

const router = express.Router();

// Get recent reports, optionally filtered by locality and time window
router.get('/', (req, res) => {
  const { area, window: timeWindow, category } = req.query;
  
  let query = 'SELECT * FROM reports WHERE (validation_status IS NULL OR validation_status = \'VALID_FOOD\')';
  let params = [];
  
  if (area) {
    query += ' AND locality LIKE ?';
    params.push(`%${area}%`);
  }

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  // Time window filtering
  if (timeWindow === '24h') {
    query += " AND created_at >= datetime('now', '-1 day')";
  } else if (timeWindow === '7d') {
    query += " AND created_at >= datetime('now', '-7 days')";
  } else if (timeWindow === '30d') {
    query += " AND created_at >= datetime('now', '-30 days')";
  }

  query += ' ORDER BY created_at DESC LIMIT 50';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching reports:', err);
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }
    
    // Sanitize and anonymize data for public map exposure
    const sanitizedRows = (rows || []).map(r => ({
      ...r,
      user_name: 'Anonymous', // Do not expose exact identity
      lat: r.lat ? parseFloat(r.lat.toFixed(3)) : r.lat,
      lng: r.lng ? parseFloat(r.lng.toFixed(3)) : r.lng,
    }));
    
    res.json(sanitizedRows);
  });
});

// Seed some initial demo data if empty
router.post('/seed', (req, res) => {
  const demoData = [
    { category: 'dairy', item_name: 'Milk - Loose', risk_level: 'high', ai_reasoning: 'Yellowish tint and thin consistency detected. Possible adulteration with water and urea.', locality: 'Koramangala, BLR', lat: 12.9352, lng: 77.6245, validation_status: 'VALID_FOOD', screening_status: 'POSSIBLE_VISUAL_CONCERN', signal_level: 'elevated' },
    { category: 'produce', item_name: 'Tomatoes', risk_level: 'low', ai_reasoning: 'Natural red color, no artificial wax shine detected. Stems look naturally dried.', locality: 'Connaught Place, DEL', lat: 28.6304, lng: 77.2177, validation_status: 'VALID_FOOD', screening_status: 'NO_OBVIOUS_VISUAL_CONCERN', signal_level: 'low' },
    { category: 'dairy', item_name: 'Paneer', risk_level: 'caution', ai_reasoning: 'Unusually bright white and rubbery texture. Could contain starch or palm oil.', locality: 'Bandra, MUM', lat: 19.0596, lng: 72.8295, validation_status: 'VALID_FOOD', screening_status: 'POSSIBLE_VISUAL_CONCERN', signal_level: 'moderate' },
    { category: 'produce', item_name: 'Apples', risk_level: 'high', ai_reasoning: 'Unnatural gloss and uniform coloring across all fruits. High probability of wax coating and artificial ripening.', locality: 'Salt Lake, KOL', lat: 22.5867, lng: 88.4143, validation_status: 'VALID_FOOD', screening_status: 'LIKELY_VISUAL_CONCERN', signal_level: 'high' },
    { category: 'dairy', item_name: 'Curd', risk_level: 'low', ai_reasoning: 'Thick consistency, slight whey separation which is natural. No thickeners detected visually.', locality: 'T Nagar, CHN', lat: 13.0418, lng: 80.2341, validation_status: 'VALID_FOOD', screening_status: 'NO_OBVIOUS_VISUAL_CONCERN', signal_level: 'low' },
    // Extra reports to demonstrate community signal clustering
    { category: 'dairy', item_name: 'Milk - Loose', risk_level: 'caution', ai_reasoning: 'Slightly thin consistency. May indicate water addition.', locality: 'Koramangala, BLR', lat: 12.9355, lng: 77.6250, validation_status: 'VALID_FOOD', screening_status: 'POSSIBLE_VISUAL_CONCERN', signal_level: 'moderate' },
    { category: 'dairy', item_name: 'Milk - Packed', risk_level: 'high', ai_reasoning: 'Yellowish tint and unusual separation visible.', locality: 'Koramangala, BLR', lat: 12.9348, lng: 77.6240, validation_status: 'VALID_FOOD', screening_status: 'LIKELY_VISUAL_CONCERN', signal_level: 'elevated' },
    { category: 'dairy', item_name: 'Paneer', risk_level: 'caution', ai_reasoning: 'Rubbery texture and unusually white color.', locality: 'Koramangala, BLR', lat: 12.9360, lng: 77.6255, validation_status: 'VALID_FOOD', screening_status: 'POSSIBLE_VISUAL_CONCERN', signal_level: 'moderate' },
  ];

  db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO reports (
      user_name, category, item_name, risk_level, ai_reasoning, 
      locality, lat, lng, validation_status, screening_status, signal_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    demoData.forEach(item => {
      stmt.run([
        'Anonymous', item.category, item.item_name, item.risk_level, 
        item.ai_reasoning, item.locality, item.lat, item.lng,
        item.validation_status, item.screening_status, item.signal_level
      ]);
    });
    
    stmt.finalize();
  });

  res.json({ message: 'Demo data seeded successfully' });
});

module.exports = router;
