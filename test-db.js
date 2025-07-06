const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: {
  rejectUnauthorized: false // Important for Render PostgreSQL
}
});

async function testConnection() {
try {
  console.log('🔄 Testing database connection...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');
  
  const client = await pool.connect();
  console.log('✅ Connected to PostgreSQL database');
  
  const result = await client.query('SELECT NOW()');
  console.log('✅ Query successful:', result.rows[0]);
  
  client.release();
  console.log('✅ Database connection test passed!');
  
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.error('Full error:', error);
} finally {
  await pool.end();
}
}

testConnection();