const { getDB } = require("../db");

async function saveGpsData(data) {
  const db = getDB();

  // 1. Raw logs (full history)
  await db.execute(
    `INSERT INTO gps_logs 
     (device_id, lat, lng, speed, heading, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.deviceId,
      data.lat,
      data.lng,
      data.speed,
      data.heading,
      data.timestamp
    ]
  );

  // 2. Live table (for live tracking)
  await db.execute(
    `REPLACE INTO live_locations
     (device_id, lat, lng, speed, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.deviceId,
      data.lat,
      data.lng,
      data.speed,
      data.timestamp
    ]
  );

  // 3. Vehicles table (REAL GPS ONLY)
  await db.execute(
    `INSERT INTO vehicles
     (rc_no, latitude, longitude, speed, status, source, formatted_date, formatted_time)
     VALUES (?, ?, ?, ?, 'moving', 'gps', CURDATE(), CURTIME())
     ON DUPLICATE KEY UPDATE
       latitude=?,
       longitude=?,
       speed=?,
       status='moving',
       source='gps',
       last_updated=NOW()`,
    [
      data.deviceId,
      data.lat,
      data.lng,
      data.speed,
      data.lat,
      data.lng,
      data.speed
    ]
  );
}

module.exports = { saveGpsData };
