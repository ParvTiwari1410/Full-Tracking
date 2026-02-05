const { getDB } = require("../db");

async function saveGpsData(data) {
  const db = getDB();

  // Ensure timestamp is a JS Date (UTC)
  const gpsTime = new Date(data.timestamp);

  // 1. Raw logs (USED FOR PLAYBACK)
  await db.execute(
    `INSERT INTO gps_logs 
     (device_id, lat, lng, speed, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.deviceId,
      data.lat,
      data.lng,
      data.speed,
      gpsTime
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
      gpsTime
    ]
  );

  // 3. Vehicles table (IMPORTANT FIX)
  await db.execute(
    `INSERT INTO vehicles
     (rc_no, latitude, longitude, speed, status, source, last_updated)
     VALUES (?, ?, ?, ?, 'moving', 'gps', ?)
     ON DUPLICATE KEY UPDATE
       latitude = VALUES(latitude),
       longitude = VALUES(longitude),
       speed = VALUES(speed),
       status = 'moving',
       source = 'gps',
       last_updated = VALUES(last_updated)`,
    [
      data.deviceId,
      data.lat,
      data.lng,
      data.speed,
      gpsTime
    ]
  );
}

module.exports = { saveGpsData };
