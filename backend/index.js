import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import db from './config/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- AUTHENTICATION MIDDLEWARE ---
// Extracts mock username token from Auth header, validates against DB Users table
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. No token provided.' });
  }
  
  const username = authHeader.split(' ')[1];
  try {
    const [rows] = await db.query(
      'SELECT id, company_name, location, username, role FROM Users WHERE username = ?', 
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Unauthorized. Invalid user session.' });
    }
    
    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error verifying token.' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const [rows] = await db.query(
      'SELECT id, company_name, location, username, password, role FROM Users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    let isMatch = false;

    // Check if password in database is a bcrypt hash
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = bcrypt.compareSync(password, user.password);
    } else {
      // Fallback to plain text check
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Return user profile and mock token (using username as token for simulation)
    res.json({
      token: user.username,
      user: {
        id: user.id,
        company_name: user.company_name,
        location: user.location,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server login error.' });
  }
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

// --- USERS ROUTES (Admin Only) ---
app.get('/api/users', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  
  try {
    const [rows] = await db.query('SELECT id, company_name, location, username, role FROM Users');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error fetching users.' });
  }
});

app.post('/api/users', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const { company_name, location, username, password, role } = req.body;
  
  try {
    const [existing] = await db.query('SELECT id FROM Users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const [result] = await db.query(
      'INSERT INTO Users (company_name, location, username, password, role) VALUES (?, ?, ?, ?, ?)',
      [company_name, location, username, hashedPassword, role || 'view']
    );
    
    res.status(201).json({
      id: result.insertId,
      company_name,
      location,
      username,
      role: role || 'view'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error creating user.' });
  }
});

app.put('/api/users/:id', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const id = parseInt(req.params.id);
  const { company_name, location, username, password, role } = req.body;
  
  try {
    const [userRows] = await db.query('SELECT password FROM Users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If password is updated, hash it; otherwise use the existing hash
    let finalPassword = userRows[0].password;
    if (password && password !== userRows[0].password) {
      finalPassword = bcrypt.hashSync(password, 10);
    }
    
    await db.query(
      'UPDATE Users SET company_name = ?, location = ?, username = ?, password = ?, role = ? WHERE id = ?',
      [company_name, location, username, finalPassword, role, id]
    );
    
    res.json({ id, company_name, location, username, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error updating user.' });
  }
});

app.delete('/api/users/:id', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const id = parseInt(req.params.id);
  
  try {
    await db.query('DELETE FROM Users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error deleting user.' });
  }
});

// --- GATEWAYS ROUTES ---
app.get('/api/gateways', authenticateUser, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Gateways');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error fetching gateways.' });
  }
});

app.post('/api/gateways', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const { gateway_name, unit_model, installation_date, longitude, latitude, status } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO Gateways (gateway_name, unit_model, installation_date, longitude, latitude, status) VALUES (?, ?, ?, ?, ?, ?)',
      [gateway_name, unit_model, installation_date || null, parseFloat(longitude), parseFloat(latitude), status || 'offline']
    );
    res.status(201).json({
      id: result.insertId,
      gateway_name,
      unit_model,
      installation_date,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      status: status || 'offline'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error creating gateway.' });
  }
});

app.put('/api/gateways/:id', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const id = parseInt(req.params.id);
  const { gateway_name, unit_model, installation_date, longitude, latitude, status } = req.body;
  
  try {
    await db.query(
      'UPDATE Gateways SET gateway_name = ?, unit_model = ?, installation_date = ?, longitude = ?, latitude = ?, status = ? WHERE id = ?',
      [gateway_name, unit_model, installation_date || null, parseFloat(longitude), parseFloat(latitude), status, id]
    );
    res.json({ id, gateway_name, unit_model, installation_date, longitude, latitude, status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error updating gateway.' });
  }
});

app.delete('/api/gateways/:id', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const id = parseInt(req.params.id);
  
  try {
    // MySQL ON DELETE SET NULL configuration will handle device gateway unassignments
    await db.query('DELETE FROM Gateways WHERE id = ?', [id]);
    res.json({ message: 'Gateway deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error deleting gateway.' });
  }
});

// --- DEVICES (NODES) ROUTES ---
app.get('/api/devices', authenticateUser, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [rows] = await db.query('SELECT * FROM Devices');
      res.json(rows);
    } else {
      // View role: only see their assigned devices
      const [rows] = await db.query('SELECT * FROM Devices WHERE id_user_owner = ?', [req.user.id]);
      res.json(rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error fetching devices.' });
  }
});

app.post('/api/devices', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const { id_gateway, id_user_owner, device_name, merk, installation_date, longitude, latitude, status } = req.body;
  const parsedOwner = id_user_owner ? parseInt(id_user_owner) : null;
  const parsedGateway = id_gateway ? parseInt(id_gateway) : null;
  
  try {
    const [result] = await db.query(
      'INSERT INTO Devices (id_gateway, id_user_owner, device_name, merk, installation_date, longitude, latitude, status, assignment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [parsedGateway, parsedOwner, device_name, merk, installation_date || null, parseFloat(longitude), parseFloat(latitude), status || 'inactive', parsedOwner ? 'assigned' : 'unassigned']
    );
    res.status(201).json({
      id: result.insertId,
      id_gateway: parsedGateway,
      id_user_owner: parsedOwner,
      device_name,
      merk,
      installation_date,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      status: status || 'inactive',
      assignment: parsedOwner ? 'assigned' : 'unassigned'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error creating device.' });
  }
});

app.put('/api/devices/:id', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const id = parseInt(req.params.id);
  const { id_gateway, id_user_owner, device_name, merk, installation_date, longitude, latitude, status } = req.body;
  const parsedOwner = id_user_owner ? parseInt(id_user_owner) : null;
  const parsedGateway = id_gateway ? parseInt(id_gateway) : null;
  
  try {
    await db.query(
      'UPDATE Devices SET id_gateway = ?, id_user_owner = ?, device_name = ?, merk = ?, installation_date = ?, longitude = ?, latitude = ?, status = ?, assignment = ? WHERE id = ?',
      [parsedGateway, parsedOwner, device_name, merk, installation_date || null, parseFloat(longitude), parseFloat(latitude), status, parsedOwner ? 'assigned' : 'unassigned', id]
    );
    res.json({
      id,
      id_gateway: parsedGateway,
      id_user_owner: parsedOwner,
      device_name,
      merk,
      installation_date,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      status,
      assignment: parsedOwner ? 'assigned' : 'unassigned'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error updating device.' });
  }
});

app.delete('/api/devices/:id', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const id = parseInt(req.params.id);
  
  try {
    await db.query('DELETE FROM Devices WHERE id = ?', [id]);
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error deleting device.' });
  }
});

// --- TELEMETRY / STATS ROUTES ---
app.get('/api/telemetry', authenticateUser, async (req, res) => {
  const { filter } = req.query; // 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'
  
  try {
    // 1. Get devices that user can see
    let devicesRows = [];
    if (req.user.role === 'admin') {
      [devicesRows] = await db.query('SELECT id FROM Devices');
    } else {
      [devicesRows] = await db.query('SELECT id FROM Devices WHERE id_user_owner = ?', [req.user.id]);
    }
    
    const allowedDeviceIds = devicesRows.map(d => d.id);
    if (allowedDeviceIds.length === 0) {
      return res.json([]);
    }
    
    // 2. Filter telemetry logs by timeframe
    const now = new Date();
    let startTime = new Date();
    
    if (filter === 'Yesterday') {
      startTime.setDate(now.getDate() - 1);
      startTime.setHours(0, 0, 0, 0);
      now.setDate(now.getDate() - 1);
      now.setHours(23, 59, 59, 999);
    } else if (filter === 'Last 7 Days') {
      startTime.setDate(now.getDate() - 7);
    } else if (filter === 'Last 30 Days') {
      startTime.setDate(now.getDate() - 30);
    } else {
      // Default: Today
      startTime.setHours(0, 0, 0, 0);
    }
    
    // 3. Query logs for allowed devices within date bounds
    // We format timestamps to standard SQL format for compatibility
    const startSql = startTime.toISOString().slice(0, 19).replace('T', ' ');
    const endSql = now.toISOString().slice(0, 19).replace('T', ' ');
    
    // Using placeholder IN expansion manually since mysql2 pool supports array binding: [allowedDeviceIds]
    const [logs] = await db.query(
      'SELECT id_device, timestamp, gas, water, electricity_non_ct, electricity_ct, rtu_kwh_total FROM TelemetryLogs WHERE id_device IN (?) AND timestamp >= ? AND timestamp <= ?',
      [allowedDeviceIds, startSql, endSql]
    );

    // 4. Aggregate data per hour (00:00 to 23:00) to return a clean summary for charting
    const hourlySummary = Array.from({ length: 24 }, (_, hour) => {
      const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
      
      // Filter logs matching this hour
      const logsInHour = logs.filter(log => new Date(log.timestamp).getHours() === hour);
      
      // Sum and average parameters
      const count = logsInHour.length || 1;
      const gas = logsInHour.reduce((sum, item) => sum + parseFloat(item.gas || 0), 0) / count;
      const water = logsInHour.reduce((sum, item) => sum + parseFloat(item.water || 0), 0) / count;
      const electricity_non_ct = logsInHour.reduce((sum, item) => sum + parseFloat(item.electricity_non_ct || 0), 0) / count;
      const electricity_ct = logsInHour.reduce((sum, item) => sum + parseFloat(item.electricity_ct || 0), 0) / count;
      const rtu_kwh_total = logsInHour.reduce((sum, item) => sum + parseFloat(item.rtu_kwh_total || 0), 0) / count;
      
      return {
        time: timeLabel,
        gas: parseFloat(gas.toFixed(2)),
        water: parseFloat(water.toFixed(2)),
        electricity_non_ct: parseFloat(electricity_non_ct.toFixed(2)),
        electricity_ct: parseFloat(electricity_ct.toFixed(2)),
        rtu_kwh_total: parseFloat(rtu_kwh_total.toFixed(2))
      };
    });
    
    res.json(hourlySummary);
  } catch (error) {
    console.error('Telemetry query error:', error);
    res.status(500).json({ message: 'Database error fetching telemetry.' });
  }
});

// --- SCHEMA & DATABASE SETUP INFO ROUTE ---
app.get('/api/db-schema', (req, res) => {
  res.json({
    message: "SQL Database schema files can be found in the project root.",
    schema: `
      CREATE TABLE Users ...
      CREATE TABLE Gateways ...
      CREATE TABLE Devices ...
      CREATE TABLE TelemetryLogs ...
    `
  });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
