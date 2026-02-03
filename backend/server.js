const winston = require('winston');
const express = require('express');
const cors = require('cors');
const { connectDB, getDB } = require('./db');

// 🔥 START GPS TCP SERVER
require('./gps/gps.server');

const app = express();
app.use(cors());

// ===============================
// Logger
// ===============================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// ===============================
// REAL LIVE VEHICLES
// ===============================
app.get('/api/vehicles', async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.execute(`
      SELECT 
        rc_no,
        latitude,
        longitude,
        speed,
        status,
        last_updated
      FROM vehicles
      WHERE source='gps'
      ORDER BY last_updated DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Vehicles API error' });
  }
});

// ===============================
// REAL PLAYBACK
// ===============================
app.get('/api/playback', async (req, res) => {
  try {
    const db = getDB();
    const { vehicleId, from, to } = req.query;

    if (!vehicleId || !from || !to) {
      return res.status(400).json({ message: 'Missing params' });
    }

    const fromTime = from.replace('T', ' ');
    const toTime = to.replace('T', ' ');

    const [points] = await db.execute(`
      SELECT 
        lat,
        lng,
        speed,
        timestamp AS created_at
      FROM gps_logs
      WHERE device_id = ?
      AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp
    `, [vehicleId, fromTime, toTime]);

    res.json({
      vehicle: {
        id: vehicleId,
        driverName: "NA"
      },
      points
    });

  } catch (err) {
    console.error('Playback API error:', err);
    res.status(500).json({ message: 'Playback error' });
  }
});

// ===============================
// TRIPS (OPTIONAL / LATER)
// ===============================
app.get('/api/trips', async (req, res) => {
  try {
    const db = getDB();
    const vehicle = req.query.vehicle || '';

    let sql = `
      SELECT 
        rc_no,
        DATE_FORMAT(trip_date, '%Y-%m-%d') AS trip_date,
        TIME_FORMAT(start_time, '%H:%i:%s') AS start_time,
        TIME_FORMAT(end_time, '%H:%i:%s') AS end_time,
        total_distance_km,
        avg_speed,
        max_speed,
        running_minutes,
        stoppage_minutes
      FROM trips
    `;
    const params = [];

    if (vehicle) {
      sql += ` WHERE rc_no LIKE ? `;
      params.push(`%${vehicle}%`);
    }

    sql += ` ORDER BY trip_date DESC`;

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Trips API error' });
  }
});

// ===============================
// BOOT
// ===============================
async function start() {
  await connectDB();
  app.listen(3000, () => {
    console.log("REST API running on http://10.0.20.204:3000");
  });
}

start();
