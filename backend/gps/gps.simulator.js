const net = require("net");

const client = new net.Socket();

client.connect(5000, "localhost", () => {
  console.log("Fake GPS connected");

  setInterval(() => {
    const lat = 23.02 + Math.random() * 0.01;
    const lng = 72.57 + Math.random() * 0.01;
    const msg = `DEVICE123,${lat},${lng},50,180`;
    client.write(msg);
  }, 2000);
});
