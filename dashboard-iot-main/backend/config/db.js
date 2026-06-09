import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'iot_monitoring',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verify connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database pool initialized and connected successfully.');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
})();

export default pool;
