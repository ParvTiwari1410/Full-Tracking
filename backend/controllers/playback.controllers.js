const db = require('../db');
console.log('🔥 NEW PLAYBACK CONTROLLER HIT 🔥');

exports.getPlayback = async (req, res) => {
  try {
    const { vehicleId, from, to } = req.query;

    if (!vehicleId || !from || !to) {
      return res.status(400).json({ message: 'Missing params' });
    }

    // 🔥 FIX: convert ISO to MySQL DATETIME
    const fromTime = from.replace('T', ' ');
    const toTime = to.replace('T', ' ');

    // 1️⃣ Vehicle + Driver
    const [vehicleRows] = await db.query(
      `SELECT v.id, v.rc_no, d.name AS driver_name
       FROM vehicles v
       LEFT JOIN drivers d ON d.vehicle_id = v.id
       WHERE v.rc_no = ?`,
      [vehicleId]
    );

    if (!vehicleRows.length) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const vehicleDbId = vehicleRows[0].id;

    // 2️⃣ Playback points
    const [points] = await db.query(
      `SELECT lat, lng, speed, created_at
       FROM vehicle_locations
       WHERE vehicle_id = ?
       AND created_at BETWEEN ? AND ?
       ORDER BY created_at ASC`,
      [vehicleDbId, fromTime, toTime]
    );

    res.json({
      vehicle: {
        id: vehicleRows[0].rc_no,
        driverName: vehicleRows[0].driver_name
      },
      points
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Playback error' });
  }
};
