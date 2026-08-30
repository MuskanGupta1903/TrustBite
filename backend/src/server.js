// Load environment variables before anything else
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const scanRoutes = require('./routes/scan');
const reportRoutes = require('./routes/reports');
const communityRoutes = require('./routes/community');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Simple rate limiter for API endpoints
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window

app.use('/api', (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  } else {
    const entry = requestCounts.get(ip);
    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + RATE_LIMIT_WINDOW;
    } else {
      entry.count++;
      if (entry.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests. Please slow down.' });
      }
    }
  }
  next();
});

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    if (now > entry.resetAt + RATE_LIMIT_WINDOW) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60000);

// Routes
app.use('/api/scan', scanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/community', communityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TrustBite API is running',
    gemini_configured: !!process.env.GEMINI_API_KEY,
  });
});

// Serve Frontend in Production
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error. Please try again.' 
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TrustBite server running on port ${PORT}`);
  console.log(`Gemini API: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT CONFIGURED — set GEMINI_API_KEY'}`);
});
