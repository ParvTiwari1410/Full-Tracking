function parsePacket(rawHex) {
  const buffer = Buffer.from(rawHex, "hex");

  // must be GT06 frame
  if (
    !(
      (buffer[0] === 0x78 && buffer[1] === 0x78) ||
      (buffer[0] === 0x79 && buffer[1] === 0x79)
    )
  ) {
    return { type: "other" };
  }

  const protocol = buffer[3];

  // ---------- LOGIN ----------
  if (protocol === 0x01) {
    const imei = readImei(buffer);
    return { type: "login", deviceId: imei };
  }

  // ---------- GPS LOCATION ----------
  // ONLY these protocols contain GPS
  if (protocol === 0x12 || protocol === 0x1A || protocol === 0x22) {
    const year = 2000 + buffer[4];
    const month = buffer[5];
    const day = buffer[6];
    const hour = buffer[7];
    const min = buffer[8];
    const sec = buffer[9];
    const timestamp = new Date(year, month - 1, day, hour, min, sec);

    // GT06 공식 공식 (this is the real one)
    const lat = buffer.readUInt32BE(11) / (60 * 30000);
    const lng = buffer.readUInt32BE(15) / (60 * 30000);

    const speed = buffer[19];

    const course = buffer.readUInt16BE(20);

    // sign bits
    let finalLat = lat;
    let finalLng = lng;

    if (!(course & 0x0400)) finalLat = -lat; // South
    if (course & 0x0800) finalLng = -lng;    // West

    return {
      type: "location",
      lat: finalLat,
      lng: finalLng,
      speed,
      timestamp
    };
  }

  // ---------- EVERYTHING ELSE ----------
  return { type: "other" };
}

function readImei(buffer) {
  let b = buffer[4];
  let imei = "" + (b & 0x0F);
  for (let i = 0; i < 7; i++) {
    b = buffer[5 + i];
    imei += ((b & 0xF0) >> 4);
    imei += (b & 0x0F);
  }
  return imei;
}

module.exports = { parsePacket };
