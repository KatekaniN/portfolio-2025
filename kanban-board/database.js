const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("connect", () => {
  console.log("🔗 Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

// Test connection on startup
/*pool
  .connect()
  .then((client) => {
    console.log("✅ Database connection successful");
  
    client.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  }); */

module.exports = { pool };
