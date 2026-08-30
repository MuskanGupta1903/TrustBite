// TrustBite — Community Intelligence Service
// Aggregates nearby reports, computes temporal trends, detects hotspots and anomalies,
// and provides duplicate/spam resistance.

const db = require('../db');

/**
 * Get community reports near a location within a radius and time window
 * Uses Haversine approximation for geographic distance
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude 
 * @param {number} radiusKm - Search radius in kilometers (default 3)
 * @param {string} category - Optional category filter
 * @returns {Promise<object>} Community intelligence data
 */
async function getCommunitySignal(lat, lng, radiusKm = 3, category = null) {
  // Convert radius to approximate degree offset (1 degree ≈ 111km)
  const degreeOffset = radiusKm / 111.0;

  const now = Date.now();
  const ms24h = 24 * 60 * 60 * 1000;
  const ms7d = 7 * ms24h;
  const ms30d = 30 * ms24h;

  try {
    // Fetch reports within bounding box (fast pre-filter)
    const reports = await queryReportsNearby(lat, lng, degreeOffset, category);

    // Filter by actual Haversine distance
    const nearbyReports = reports.filter(r => {
      const dist = haversineDistance(lat, lng, r.lat, r.lng);
      r._distance_km = dist;
      return dist <= radiusKm;
    });

    // Temporal bucketing
    const reports24h = nearbyReports.filter(r => {
      const reportTime = new Date(r.created_at).getTime();
      return (now - reportTime) <= ms24h;
    });
    const reports7d = nearbyReports.filter(r => {
      const reportTime = new Date(r.created_at).getTime();
      return (now - reportTime) <= ms7d;
    });
    const reports30d = nearbyReports.filter(r => {
      const reportTime = new Date(r.created_at).getTime();
      return (now - reportTime) <= ms30d;
    });

    // Category-specific reports
    const similarCategoryReports = category
      ? reports7d.filter(r => r.category === category)
      : reports7d;

    // Compute trend
    const trend = computeTrend(reports24h.length, reports7d.length, reports30d.length);

    // Detect anomaly
    const anomaly = detectAnomaly(reports24h.length, reports7d.length, reports30d.length);

    return {
      nearby_reports_24h: reports24h.length,
      nearby_reports_7d: reports7d.length,
      nearby_reports_30d: reports30d.length,
      radius_km: radiusKm,
      trend: trend.direction,
      trend_description: trend.description,
      anomaly_detected: anomaly.detected,
      anomaly_description: anomaly.description,
      similar_category_reports: similarCategoryReports.length,
      recent_items: getRecentItems(reports7d),
    };
  } catch (err) {
    console.error('[CommunityIntel] Error:', err.message);
    return getEmptyCommunitySignal(radiusKm);
  }
}

/**
 * Query reports near a location using bounding box
 */
function queryReportsNearby(lat, lng, degreeOffset, category) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT * FROM reports 
      WHERE lat BETWEEN ? AND ? 
        AND lng BETWEEN ? AND ?
        AND lat != 0 AND lng != 0
        AND (validation_status IS NULL OR validation_status = 'VALID_FOOD')
    `;
    const params = [
      lat - degreeOffset, lat + degreeOffset,
      lng - degreeOffset, lng + degreeOffset,
    ];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT 200';

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Haversine distance in km between two lat/lng points
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Compute temporal trend based on report counts
 */
function computeTrend(count24h, count7d, count30d) {
  // Calculate daily rates
  const rate24h = count24h; // reports per day (last 24h)
  const rate7d = count7d / 7; // avg reports per day (last 7 days)
  const rate30d = count30d / 30; // avg reports per day (last 30 days)

  if (count30d === 0 && count7d === 0 && count24h === 0) {
    return { direction: 'STABLE', description: 'No reports in this area.' };
  }

  if (count7d === 0 && count24h > 0) {
    return { direction: 'UNUSUAL_SPIKE', description: `${count24h} new reports in the last 24 hours with no prior recent activity.` };
  }

  if (rate7d === 0) {
    return { direction: 'STABLE', description: 'Very little recent activity.' };
  }

  const ratio = rate24h / rate7d;

  if (ratio > 3) {
    return { direction: 'UNUSUAL_SPIKE', description: `Reports in the last 24 hours are ${ratio.toFixed(1)}x the weekly average.` };
  }
  if (ratio > 1.5) {
    return { direction: 'INCREASING', description: 'Reports are increasing compared to the weekly average.' };
  }
  if (ratio < 0.3 && count30d > 5) {
    return { direction: 'DECREASING', description: 'Reports are decreasing compared to the weekly average.' };
  }

  return { direction: 'STABLE', description: 'Report frequency is within normal range.' };
}

/**
 * Detect statistical anomaly in report patterns
 */
function detectAnomaly(count24h, count7d, count30d) {
  // Simple z-score-like anomaly detection
  // If 24h count is significantly above the expected daily rate
  const dailyBaseline = count30d / 30;
  
  if (dailyBaseline === 0) {
    if (count24h >= 3) {
      return {
        detected: true,
        description: `Unusual: ${count24h} reports in the last 24 hours in an area with no recent history.`,
      };
    }
    return { detected: false, description: null };
  }

  // If today's count is more than 3 standard deviations above baseline
  // For Poisson-distributed events, std ≈ sqrt(mean)
  const std = Math.sqrt(dailyBaseline);
  const zScore = (count24h - dailyBaseline) / (std || 1);

  if (zScore > 3) {
    return {
      detected: true,
      description: `Unusual increase: ${count24h} reports in the last 24 hours vs. a baseline of ~${dailyBaseline.toFixed(1)} per day.`,
    };
  }

  return { detected: false, description: null };
}

/**
 * Get unique recent items from reports
 */
function getRecentItems(reports) {
  const items = {};
  reports.forEach(r => {
    if (r.item_name) {
      items[r.item_name] = (items[r.item_name] || 0) + 1;
    }
  });
  return Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

/**
 * Return empty community signal
 */
function getEmptyCommunitySignal(radiusKm = 3) {
  return {
    nearby_reports_24h: 0,
    nearby_reports_7d: 0,
    nearby_reports_30d: 0,
    radius_km: radiusKm,
    trend: 'STABLE',
    trend_description: 'No reports in this area.',
    anomaly_detected: false,
    anomaly_description: null,
    similar_category_reports: 0,
    recent_items: [],
  };
}

/**
 * Check for duplicate image by hash
 * @param {string} imageHash - SHA-256 hash of the uploaded image
 * @returns {Promise<object|null>} Existing report if duplicate found
 */
function checkDuplicate(imageHash) {
  return new Promise((resolve, reject) => {
    if (!imageHash) {
      resolve(null);
      return;
    }
    db.get(
      'SELECT id, created_at FROM reports WHERE image_hash = ? ORDER BY created_at DESC LIMIT 1',
      [imageHash],
      (err, row) => {
        if (err) {
          console.error('[CommunityIntel] Duplicate check error:', err.message);
          resolve(null);
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

/**
 * Check for spam: too many reports from same user in short time
 * @param {string} userName - User name
 * @param {number} windowMinutes - Time window to check (default 10 minutes)
 * @param {number} maxReports - Max allowed reports in window (default 5)
 * @returns {Promise<boolean>} True if spam detected
 */
function checkSpam(userName, windowMinutes = 10, maxReports = 5) {
  return new Promise((resolve, reject) => {
    if (!userName) {
      resolve(false);
      return;
    }
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    db.get(
      'SELECT COUNT(*) as count FROM reports WHERE user_name = ? AND created_at >= ?',
      [userName, cutoff],
      (err, row) => {
        if (err) {
          console.error('[CommunityIntel] Spam check error:', err.message);
          resolve(false);
        } else {
          resolve(row && row.count >= maxReports);
        }
      }
    );
  });
}

/**
 * Get hotspots — clusters of reports with elevated activity
 * @returns {Promise<Array>} List of hotspot areas
 */
function getHotspots() {
  return new Promise((resolve, reject) => {
    // Group reports by locality within the last 7 days
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    db.all(`
      SELECT 
        locality,
        category,
        AVG(lat) as center_lat,
        AVG(lng) as center_lng,
        COUNT(*) as report_count,
        SUM(CASE WHEN screening_status IN ('POSSIBLE_VISUAL_CONCERN', 'LIKELY_VISUAL_CONCERN') THEN 1 ELSE 0 END) as concern_count,
        SUM(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 ELSE 0 END) as reports_24h,
        MIN(created_at) as first_report,
        MAX(created_at) as latest_report
      FROM reports
      WHERE created_at >= ?
        AND lat != 0 AND lng != 0
        AND (validation_status IS NULL OR validation_status = 'VALID_FOOD')
      GROUP BY locality, category
      HAVING report_count >= 2
      ORDER BY report_count DESC
      LIMIT 20
    `, [cutoff7d], (err, rows) => {
      if (err) {
        console.error('[CommunityIntel] Hotspot query error:', err.message);
        resolve([]);
        return;
      }

      const hotspots = (rows || []).map(row => {
        let level = 'LOW_ACTIVITY';
        if (row.report_count >= 10 || row.reports_24h >= 5) level = 'HIGH_ACTIVITY';
        else if (row.report_count >= 5 || row.reports_24h >= 3) level = 'ELEVATED';
        else if (row.report_count >= 3 || row.reports_24h >= 2) level = 'EMERGING';

        return {
          locality: row.locality,
          category: row.category,
          center: { lat: row.center_lat, lng: row.center_lng },
          report_count: row.report_count,
          concern_count: row.concern_count,
          reports_24h: row.reports_24h,
          level,
          first_report: row.first_report,
          latest_report: row.latest_report,
        };
      });

      resolve(hotspots);
    });
  });
}

/**
 * Get real-time statistics for a locality
 * @param {string} locality - Locality name
 * @returns {Promise<object>} Statistics
 */
function getLocalStats(locality) {
  return new Promise((resolve, reject) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const queries = {
      totalToday: `SELECT COUNT(*) as count FROM reports WHERE created_at >= ? AND (validation_status IS NULL OR validation_status = 'VALID_FOOD')`,
      localToday: `SELECT COUNT(*) as count FROM reports WHERE created_at >= ? AND locality LIKE ? AND (validation_status IS NULL OR validation_status = 'VALID_FOOD')`,
      totalAll: `SELECT COUNT(*) as count FROM reports WHERE (validation_status IS NULL OR validation_status = 'VALID_FOOD')`,
    };

    db.get(queries.totalToday, [todayStr], (err, totalToday) => {
      if (err) { resolve({ scansToday: 0, localScansToday: 0, totalScans: 0 }); return; }
      
      db.get(queries.localToday, [todayStr, `%${locality || ''}%`], (err2, localToday) => {
        if (err2) { resolve({ scansToday: totalToday?.count || 0, localScansToday: 0, totalScans: 0 }); return; }
        
        db.get(queries.totalAll, [], (err3, totalAll) => {
          resolve({
            scansToday: totalToday?.count || 0,
            localScansToday: localToday?.count || 0,
            totalScans: totalAll?.count || 0,
          });
        });
      });
    });
  });
}

module.exports = {
  getCommunitySignal,
  checkDuplicate,
  checkSpam,
  getHotspots,
  getLocalStats,
  getEmptyCommunitySignal,
  haversineDistance,
};
