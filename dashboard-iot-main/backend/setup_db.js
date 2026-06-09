import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true
};

async function setupDatabase() {
  console.log('Connecting to MySQL with configuration:', {
    host: dbConfig.host,
    user: dbConfig.user,
    port: dbConfig.port,
    password: dbConfig.password ? '****' : '(none)'
  });

  let connection;
  try {
    // 1. Initial connection without database selection (to create the DB if not exists)
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Successfully connected to MySQL server.');

    // 2. Read schema.sql from the parent directory
    const schemaPath = path.resolve('../schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at path: ${schemaPath}`);
    }

    console.log('Reading schema.sql...');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    // 3. Execute schema script
    console.log('Initializing database schema & seeds...');
    // mysql2 multipleStatements allows running multiple queries at once
    await connection.query(sqlScript);

    console.log('====================================================');
    console.log('Database "iot_monitoring" initialized successfully!');
    console.log('Created Tables: Users, Gateways, Devices, TelemetryLogs');
    console.log('Default Seed Data Has Been Generated.');
    console.log('====================================================');

  } catch (error) {
    console.error('Error setting up the database:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n[TIP] Please check if MySQL is running on localhost:3306');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n[TIP] Access Denied. Please configure your username & password in backend/.env');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
