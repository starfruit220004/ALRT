const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "smart_alert",
    password: process.env.DB_PASSWORD || "password",
    port: process.env.DB_PORT || 5432,
});

// Use this to check if the connection actually works
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed:', err.stack);
  } else {
    console.log('Connected to Postgres at:', res.rows[0].now);
  }
});

module.exports = pool;