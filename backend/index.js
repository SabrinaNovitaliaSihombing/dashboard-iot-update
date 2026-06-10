import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Multer config for tenant photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `tenant_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed (max 1MB)'));
  }
});

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
    let query = `
      SELECT d.*, t.tenant_name 
      FROM Devices d 
      LEFT JOIN Tenants t ON d.id_tenant = t.id
    `;
    let params = [];
    if (req.user.role !== 'admin') {
      query += ' WHERE d.id_user_owner = ?';
      params.push(req.user.id);
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error fetching devices.' });
  }
});

app.post('/api/devices', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const { id_tenant, id_user_owner, device_name, merk, installation_date, longitude, latitude, status } = req.body;
  const parsedOwner = id_user_owner ? parseInt(id_user_owner) : null;
  const parsedTenant = id_tenant ? parseInt(id_tenant) : null;

  try {
    const [result] = await db.query(
      'INSERT INTO Devices (id_tenant, id_user_owner, device_name, merk, installation_date, longitude, latitude, status, assignment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [parsedTenant, parsedOwner, device_name, merk, installation_date || null, parseFloat(longitude), parseFloat(latitude), status || 'inactive', parsedOwner ? 'assigned' : 'unassigned']
    );
    res.status(201).json({
      id: result.insertId,
      id_tenant: parsedTenant,
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
  const { id_tenant, id_user_owner, device_name, merk, installation_date, longitude, latitude, status } = req.body;
  const parsedOwner = id_user_owner ? parseInt(id_user_owner) : null;
  const parsedTenant = id_tenant ? parseInt(id_tenant) : null;

  try {
    await db.query(
      'UPDATE Devices SET id_tenant = ?, id_user_owner = ?, device_name = ?, merk = ?, installation_date = ?, longitude = ?, latitude = ?, status = ?, assignment = ? WHERE id = ?',
      [parsedTenant, parsedOwner, device_name, merk, installation_date || null, parseFloat(longitude), parseFloat(latitude), status, parsedOwner ? 'assigned' : 'unassigned', id]
    );
    res.json({
      id,
      id_tenant: parsedTenant,
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

// --- TENANTS ROUTES ---
app.get('/api/tenants', authenticateUser, async (req, res) => {
  try {
    const query = `
      SELECT 
        t.*,
        g.gateway_name,
        tl.active_power,
        tl.current_val,
        tl.voltage,
        tl.rtu_kwh_total,
        tl.usage_kwh_total
      FROM Tenants t
      LEFT JOIN Gateways g ON t.id_gateway = g.id
      LEFT JOIN Devices d ON d.id_tenant = t.id
      LEFT JOIN (
        SELECT tl1.* 
        FROM TelemetryLogs tl1
        INNER JOIN (
          SELECT id_device, MAX(timestamp) as max_ts
          FROM TelemetryLogs
          GROUP BY id_device
        ) tl2 ON tl1.id_device = tl2.id_device AND tl1.timestamp = tl2.max_ts
      ) tl ON tl.id_device = d.id
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error fetching tenants.' });
  }
});

app.post('/api/tenants', authenticateUser, upload.single('photo'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const {
    tenant_name, company_name, password, address,
    billing_address, email, username, phone, handphone,
    allocation_node_type, description, id_gateway
  } = req.body;
  const parsedGateway = id_gateway ? parseInt(id_gateway) : null;
  const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

  // Hash password if provided
  const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;

  try {
    const [result] = await db.query(
      `INSERT INTO Tenants 
        (tenant_name, company_name, password, address, billing_address, email, username, phone, handphone, allocation_node_type, photo, description, id_gateway) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenant_name, company_name || null, hashedPassword, address || null, billing_address || null,
       email || null, username || null, phone || null, handphone || null,
       allocation_node_type || null, photoPath, description || null, parsedGateway]
    );
    res.status(201).json({
      id: result.insertId,
      tenant_name, company_name, address, billing_address, email,
      username, phone, handphone, allocation_node_type,
      photo: photoPath, description, id_gateway: parsedGateway
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error creating tenant.' });
  }
});

app.put('/api/tenants/:id', authenticateUser, upload.single('photo'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const id = parseInt(req.params.id);
  const {
    tenant_name, company_name, password, address,
    billing_address, email, username, phone, handphone,
    allocation_node_type, description, id_gateway
  } = req.body;
  const parsedGateway = id_gateway ? parseInt(id_gateway) : null;

  try {
    // Get existing tenant to preserve photo if not uploading new one
    const [existing] = await db.query('SELECT photo, password FROM Tenants WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Tenant not found' });

    const photoPath = req.file ? `/uploads/${req.file.filename}` : existing[0].photo;

    // Hash password only if a new one is provided
    let finalPassword = existing[0].password;
    if (password && password.trim() !== '') {
      finalPassword = bcrypt.hashSync(password, 10);
    }

    await db.query(
      `UPDATE Tenants SET 
        tenant_name=?, company_name=?, password=?, address=?, billing_address=?,
        email=?, username=?, phone=?, handphone=?, allocation_node_type=?,
        photo=?, description=?, id_gateway=?
       WHERE id=?`,
      [tenant_name, company_name || null, finalPassword, address || null, billing_address || null,
       email || null, username || null, phone || null, handphone || null,
       allocation_node_type || null, photoPath, description || null, parsedGateway, id]
    );
    res.json({
      id, tenant_name, company_name, address, billing_address, email,
      username, phone, handphone, allocation_node_type,
      photo: photoPath, description, id_gateway: parsedGateway
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error updating tenant.' });
  }
});

app.delete('/api/tenants/:id', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  const id = parseInt(req.params.id);

  try {
    // Remove photo file if exists
    const [rows] = await db.query('SELECT photo FROM Tenants WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].photo) {
      const filePath = path.join(__dirname, rows[0].photo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.query('DELETE FROM Tenants WHERE id = ?', [id]);
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Database error deleting tenant.' });
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
