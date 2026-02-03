const net = require("net");
const { parsePacket } = require("./gps.parser");
const { saveGpsData } = require("./gps.service");

const server = net.createServer(socket => {
  console.log("GPS device connected");

  socket.on("data", async data => {
    const raw = data.toString('hex');   // 🔥 THIS IS THE KEY CHANGE
    console.log("RAW:", raw);

    const gpsData = parsePacket(raw);
    if (!gpsData) return;

    await saveGpsData(gpsData);
    console.log("SAVED:", gpsData);
  });

  socket.on("end", () => {
    console.log("GPS device disconnected");
  });
});

server.listen(6002, () => {
  console.log("GPS TCP Server running on port 5000");
});
