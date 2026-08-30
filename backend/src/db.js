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
      // Original reports table
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

      // Add new columns incrementally (ALTER TABLE is non-destructive)
      // These silently fail if column already exists, which is what we want
      const newColumns = [
        "ALTER TABLE reports ADD COLUMN validation_status TEXT",
        "ALTER TABLE reports ADD COLUMN detected_category TEXT",
        "ALTER TABLE reports ADD COLUMN detected_item TEXT",
        "ALTER TABLE reports ADD COLUMN image_quality TEXT",
        "ALTER TABLE reports ADD COLUMN screening_status TEXT",
        "ALTER TABLE reports ADD COLUMN visual_observations TEXT",
        "ALTER TABLE reports ADD COLUMN sensory_data TEXT",
        "ALTER TABLE reports ADD COLUMN image_hash TEXT",
        "ALTER TABLE reports ADD COLUMN signal_level TEXT",
        "ALTER TABLE reports ADD COLUMN community_signal TEXT",
        "ALTER TABLE reports ADD COLUMN risk_factors TEXT",
      ];

      newColumns.forEach(sql => {
        db.run(sql, (err) => {
          // Ignore "duplicate column" errors — expected on subsequent runs
          if (err && !err.message.includes('duplicate column')) {
            console.error('Schema migration error:', err.message);
          }
        });
      });

      // Community alerts table
      db.run(`CREATE TABLE IF NOT EXISTS community_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        locality TEXT,
        lat REAL,
        lng REAL,
        category TEXT,
        alert_level TEXT,
        report_count INTEGER,
        time_window TEXT,
        description TEXT,
        status TEXT DEFAULT 'NEW',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME
      )`);

      // Index for geographic queries
      db.run(`CREATE INDEX IF NOT EXISTS idx_reports_location ON reports (lat, lng)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_reports_created ON reports (created_at)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_reports_hash ON reports (image_hash)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_reports_validation ON reports (validation_status)`);

      console.log('Database schema initialized with intelligence upgrade columns.');
    });
  }
});

module.exports = db;
