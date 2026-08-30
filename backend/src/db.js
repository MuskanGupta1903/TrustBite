const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'trustbite.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Initialize schema
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT,
        category TEXT,
        item_name TEXT,
        risk_level TEXT,
        ai_reasoning TEXT,
        locality TEXT,
        lat REAL,
        lng REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }
});

module.exports = db;
