const net = require("net");
const { parsePacket } = require("./gps.parser");
const { saveGpsData } = require("./gps.service");

const server = net.createServer(socket => {
  console.log("GPS device connected");

  socket.on("data", async data => {
    const raw = data.toString("hex");
    console.log("RAW:", raw);

    const gpsData = parsePacket(raw);
    if (!gpsData) return;

    // LOGIN
    if (gpsData.type === "login") {
      socket.deviceId = gpsData.deviceId;   // 🔥 store IMEI in session
      console.log("LOGIN from device:", socket.deviceId);

      const ack = Buffer.from("787805010001D9DC0D0A", "hex");
      socket.write(ack);
      console.log("LOGIN ACK sent");
      return;
    }

    // LOCATION
    if (gpsData.type === "location") {
      // attach IMEI from session
      gpsData.deviceId = socket.deviceId;

      await saveGpsData(gpsData);
      console.log("SAVED LOCATION:", gpsData.lat, gpsData.lng);
      return;
    }

    console.log("IGNORED PACKET TYPE:", gpsData.type);
  });

  socket.on("end", () => {
    console.log("GPS device disconnected");
  });
});

server.listen(6002, () => {
  console.log("GPS TCP Server running on port 6002");
});
