const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeImage } = require('../services/visionAI');
const db = require('../db');

const router = express.Router();

// Setup multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    const { category, locality, lat, lng, userName, itemName } = req.body;
    
    // In a real app, we would pass the image buffer or path to the Vision AI
    // For this demo, we simulate the AI analysis delay and response
    const analysisResult = await analyzeImage(req.file.path, category, itemName);

    // Save report to database
    db.run(
      `INSERT INTO reports (user_name, category, item_name, risk_level, ai_reasoning, locality, lat, lng) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userName || 'Anonymous',
        category || 'unknown',
        itemName || analysisResult.itemName,
        analysisResult.riskLevel,
        analysisResult.reasoning,
        locality || 'Unknown Location',
        parseFloat(lat) || 0,
        parseFloat(lng) || 0
      ],
      function (err) {
        if (err) {
          console.error('Error saving report:', err);
          return res.status(500).json({ error: 'Failed to save report' });
        }
        
        res.json({
          id: this.lastID,
          result: analysisResult,
          message: 'Scan complete and report saved'
        });
      }
    );
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Internal server error during scan' });
  }
});

module.exports = router;
