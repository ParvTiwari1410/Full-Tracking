function parsePacket(rawHex) {
  const buffer = Buffer.from(rawHex, 'hex');

  // 1. Extract IMEI
  const imei = readImei(buffer);

  // 2. Time
  const year = 2000 + buffer[4];
  const month = buffer[5];
  const day = buffer[6];
  const hour = buffer[7];
  const min = buffer[8];
  const sec = buffer[9];
  const timestamp = new Date(year, month - 1, day, hour, min, sec);

  // 3. Latitude & Longitude
  const lat = buffer.readUInt32BE(11) / (60 * 30000);
  const lng = buffer.readUInt32BE(15) / (60 * 30000);

  // 4. Speed
  const speed = buffer[19];

  // 5. Heading
  const union = buffer.readUInt16BE(20);
  const heading = union & 0x03FF;

  return {
    deviceId: imei,
    lat,
    lng,
    speed,
    heading,
    timestamp
  };
}

// IMEI decoder (GT06 specific)
function readImei(buffer) {
  let b = buffer[4];
  let imei = "";
  imei += (b & 0x0F);

  for (let i = 0; i < 7; i++) {
    b = buffer[5 + i];
    imei += ((b & 0xF0) >> 4);
    imei += (b & 0x0F);
  }
  return imei;
}

module.exports = { parsePacket };
