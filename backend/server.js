const net = require('net');
const axios = require('axios');
const mysql = require('mysql2/promise');
const winston = require('winston');
const express = require('express');
const cors = require('cors');

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
// MySQL
// ===============================
let db;

async function connectMySQL() {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'fleetuser',
    password: 'Fleet@1234',
    database: 'TRACKING'
  });

  console.log("MySQL Connected");
}

// ===============================
// REST APIs
// ===============================

// Vehicles API (LIVE)
app.get('/api/vehicles', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT rc_no, latitude, longitude, speed, status,
           formatted_date, formatted_time
    FROM vehicles
    ORDER BY last_updated DESC
  `);
  res.json(rows);
});

// Trips API
app.get('/api/trips', async (req, res) => {
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
});

// ===============================
// Playback API (HISTORY)
// ===============================
// ===============================
// Playback API (HISTORY)
// ===============================
app.get('/api/playback', async (req, res) => {
  try {
    const { vehicleId, from, to } = req.query;

    if (!vehicleId || !from || !to) {
      return res.status(400).json({ message: 'Missing params' });
    }

    // 🔥 FIX: Convert ISO datetime to MySQL DATETIME
    const fromTime = from.replace('T', ' ');
    const toTime = to.replace('T', ' ');

    // 1️⃣ Vehicle + Driver
    const [vehicleRows] = await db.execute(`
      SELECT v.rc_no, d.name AS driver_name
      FROM vehicles v
      LEFT JOIN drivers d ON d.vehicle_id = v.id
      WHERE v.rc_no = ?
    `, [vehicleId]);

    if (!vehicleRows.length) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // 2️⃣ Playback history (CORRECT TABLE)
    const [points] = await db.execute(`
      SELECT 
        latitude AS lat,
        longitude AS lng,
        speed,
        created_at
      FROM vehicle_locations_history
      WHERE rc_no = ?
      AND created_at BETWEEN ? AND ?
      ORDER BY created_at
    `, [vehicleId, fromTime, toTime]);

    // 3️⃣ Final response (frontend expects this)
    res.json({
      vehicle: {
        id: vehicleRows[0].rc_no,
        driverName: vehicleRows[0].driver_name
      },
      points
    });

  } catch (err) {
    console.error('Playback API error:', err);
    res.status(500).json({ message: 'Playback error' });
  }
});


// ===============================
// WheelsEye API
// ===============================
const wheelsEyeApiUrl =
  "https://api.wheelseye.com/currentLoc?accessToken=7807f519-ee79-41dd-8407-ce905abb1d47";

// ===============================
// Time Helper
// ===============================
function formatFromEpoch(epoch) {
  const date = new Date(epoch * 1000);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const i = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');

  return {
    formattedDate: `${y}-${m}-${d}`,
    formattedTime: `${h}:${i}:${s}`
  };
}

// ===============================
// Polling Function
// ===============================
async function fetchAndStore() {
  try {
    const response = await axios.get(wheelsEyeApiUrl);
    const vehicles = response.data?.data?.list || [];

    console.log(`Fetched ${vehicles.length} vehicles`);

    for (const v of vehicles) {
      const rc_no = v.vehicleNumber;
      // 🔥 FAKE MOVEMENT (DEV MODE)
const lat = (v.latitude || 0) + (Math.random() - 0.5) * 0.001;
const lng = (v.longitude || 0) + (Math.random() - 0.5) * 0.001;

      const speed = Math.round(v.speed || 0);

      let status = 'offline';
      if (v.ignition && speed > 0) status = 'moving';
      else if (v.ignition) status = 'idle';

      const { formattedDate, formattedTime } =
        formatFromEpoch(v.dttimeInEpoch);

      // LIVE TABLE (current state)
      await db.execute(`
        INSERT INTO vehicles
        (rc_no, latitude, longitude, speed, status, formatted_date, formatted_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        latitude=?, longitude=?, speed=?, status=?,
        formatted_date=?, formatted_time=?, last_updated=NOW()
      `, [
        rc_no, lat, lng, speed, status, formattedDate, formattedTime,
        lat, lng, speed, status, formattedDate, formattedTime
      ]);

      // HISTORY TABLE (playback)
      await db.execute(`
        INSERT INTO vehicle_locations_history
        (rc_no, latitude, longitude, speed, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [rc_no, lat, lng, speed]);
    }

  } catch (err) {
    console.error("API Error:", err.message);
    logger.error(err.message);
  }
}

// ===============================
// Start Polling
// ===============================
async function startPolling() {
  await connectMySQL();
  await fetchAndStore();
  setInterval(fetchAndStore, 30000);
}

// ===============================
// TCP Server
// ===============================
const server = net.createServer((socket) => {
  console.log("Client connected");

  socket.on('data', () => {
    socket.write("GPS server running\n");
  });

  socket.on('end', () => {
    console.log("Client disconnected");
  });

  socket.on('error', err => {
    console.log("Socket error:", err.message);
  });
});

server.clients = new Set();
server.on('connection', (socket) => {
  server.clients.add(socket);
  socket.on('close', () => server.clients.delete(socket));
});

// ===============================
// Boot
// ===============================
server.listen(9032, () => {
  console.log("TCP server running on port 9032");
  startPolling();
});

app.listen(3000, () => {
  console.log("REST API running on http://localhost:3000");
});
