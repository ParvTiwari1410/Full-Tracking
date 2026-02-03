const mysql = require('mysql2/promise');

let db;

async function connectDB() {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'fleetuser',
    password: 'Fleet@1234',
    database: 'TRACKING'
  });
  console.log("MySQL Connected");
}

function getDB() {
  return db;
}

module.exports = { connectDB, getDB };
