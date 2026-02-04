const { getDB } = require("../db");

async function saveGpsData(data) {
  const db = getDB();

  // 1. Raw logs (playback source of truth)
  await db.execute(
    `INSERT INTO gps_logs 
     (device_id, lat, lng, speed, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.deviceId,
      data.lat,
      data.lng,
      data.speed,
      data.timestamp   // GPS TIME
    ]
  );

  // 2. Live table
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

  // 3. Vehicles table (IMPORTANT FIX HERE)
  await db.execute(
    `INSERT INTO vehicles
     (rc_no, latitude, longitude, speed, status, source, last_updated)
     VALUES (?, ?, ?, ?, 'moving', 'gps', ?)
     ON DUPLICATE KEY UPDATE
       latitude=?,
       longitude=?,
       speed=?,
       status='moving',
       source='gps',
       last_updated=?`,
    [
      data.deviceId,
      data.lat,
      data.lng,
      data.speed,
      data.timestamp,   // <-- GPS TIME

      data.lat,
      data.lng,
      data.speed,
      data.timestamp    // <-- GPS TIME
    ]
  );
}

module.exports = { saveGpsData };
