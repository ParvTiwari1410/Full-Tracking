const { connectDB, getDB } = require('./db');

// Haversine formula
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function generateTrips(date) {
  await connectDB();
  const db = getDB();

  const [vehicles] = await db.execute(`
    SELECT DISTINCT rc_no FROM vehicles
  `);

  for (const v of vehicles) {
    const rc = v.rc_no;

    const [points] = await db.execute(`
      SELECT * FROM vehicles
      WHERE rc_no=? AND formatted_date=?
      ORDER BY formatted_time
    `, [rc, date]);

    console.log("Processing", rc, "points:", points.length);
    if (points.length < 1) continue;

    let totalDist = 0;
    let maxSpeed = 0;
    let speedSum = 0;
    let movingCount = 0;
    let stoppageMinutes = 0;

    let stopStart = null;
    const stoppages = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      totalDist += distanceKm(
        p1.latitude, p1.longitude,
        p2.latitude, p2.longitude
      );

      maxSpeed = Math.max(maxSpeed, p1.speed);

      if (p1.speed > 0) {
        speedSum += p1.speed;
        movingCount++;

        if (stopStart) {
          const diff = 1; // minutes
          if (diff >= 10) {
            stoppages.push({
              from: stopStart,
              to: p1.formatted_time,
              dur: diff
            });
            stoppageMinutes += diff;
          }
          stopStart = null;
        }
      } else {
        if (!stopStart) stopStart = p1.formatted_time;
      }
    }

    const avgSpeed = movingCount ? speedSum / movingCount : 0;
    const runningMinutes = points.length - stoppageMinutes;

    await db.execute(`
      INSERT INTO trips
      (rc_no, trip_date, start_time, end_time,
       total_distance_km, avg_speed, max_speed,
       running_minutes, stoppage_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
       total_distance_km=?, avg_speed=?, max_speed=?,
       running_minutes=?, stoppage_minutes=?
    `, [
      rc, date,
      points[0].formatted_time,
      points[points.length - 1].formatted_time,
      totalDist.toFixed(2),
      avgSpeed.toFixed(1),
      maxSpeed,
      runningMinutes,
      stoppageMinutes,
      totalDist.toFixed(2),
      avgSpeed.toFixed(1),
      maxSpeed,
      runningMinutes,
      stoppageMinutes
    ]);

    for (const s of stoppages) {
      await db.execute(`
        INSERT INTO trip_stoppages
        (rc_no, trip_date, start_time, end_time, duration_minutes)
        VALUES (?, ?, ?, ?, ?)
      `, [rc, date, s.from, s.to, s.dur]);
    }

    console.log("Trip generated:", rc);
  }
}

/* Run */
const today = new Date().toISOString().slice(0, 10);
generateTrips(today);
