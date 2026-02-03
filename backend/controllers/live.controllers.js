const { getDB } = require('../db');

exports.getLiveLocation = async (req, res) => {
  try {
    const db = getDB();
    const deviceId = req.params.deviceId;

    const [rows] = await db.execute(
      "SELECT * FROM live_locations WHERE device_id = ?",
      [deviceId]
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};
