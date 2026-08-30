const express = require('express');
const db = require('../db');

const router = express.Router();

// Get recent reports, optionally filtered by locality
router.get('/', (req, res) => {
  const { area } = req.query;
  
  let query = 'SELECT * FROM reports ORDER BY created_at DESC LIMIT 50';
  let params = [];
  
  if (area) {
    query = 'SELECT * FROM reports WHERE locality LIKE ? ORDER BY created_at DESC LIMIT 50';
    params = [`%${area}%`];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching reports:', err);
      return res.status(500).json({ error: 'Failed to fetch reports' });
    }
    res.json(rows);
  });
});

// Seed some initial demo data if empty
router.post('/seed', (req, res) => {
  const demoData = [
    { category: 'dairy', item_name: 'Milk - Loose', risk_level: 'high', ai_reasoning: 'Yellowish tint and thin consistency detected. Possible adulteration with water and urea.', locality: 'Koramangala, BLR', lat: 12.9352, lng: 77.6245 },
    { category: 'produce', item_name: 'Tomatoes', risk_level: 'low', ai_reasoning: 'Natural red color, no artificial wax shine detected. Stems look naturally dried.', locality: 'Connaught Place, DEL', lat: 28.6304, lng: 77.2177 },
    { category: 'dairy', item_name: 'Paneer', risk_level: 'caution', ai_reasoning: 'Unusually bright white and rubbery texture. Could contain starch or palm oil.', locality: 'Bandra, MUM', lat: 19.0596, lng: 72.8295 },
    { category: 'produce', item_name: 'Apples', risk_level: 'high', ai_reasoning: 'Unnatural gloss and uniform coloring across all fruits. High probability of wax coating and artificial ripening.', locality: 'Salt Lake, KOL', lat: 22.5867, lng: 88.4143 },
    { category: 'dairy', item_name: 'Curd', risk_level: 'low', ai_reasoning: 'Thick consistency, slight whey separation which is natural. No thickeners detected visually.', locality: 'T Nagar, CHN', lat: 13.0418, lng: 80.2341 }
  ];

  db.serialize(() => {
    const stmt = db.prepare('INSERT INTO reports (user_name, category, item_name, risk_level, ai_reasoning, locality, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    
    demoData.forEach(item => {
      stmt.run(['Anonymous', item.category, item.item_name, item.risk_level, item.ai_reasoning, item.locality, item.lat, item.lng]);
    });
    
    stmt.finalize();
  });

  res.json({ message: 'Demo data seeded successfully' });
});

module.exports = router;
