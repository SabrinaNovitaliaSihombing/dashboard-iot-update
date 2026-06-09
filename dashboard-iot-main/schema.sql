-- IoT Monitoring Dashboard - MySQL Database Schema
-- Run this script in your local MySQL instance to set up the tables.

CREATE DATABASE IF NOT EXISTS iot_monitoring;
USE iot_monitoring;

-- 1. Users Table
-- Stores user accounts and authorization roles.
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password (using bcrypt)
    role ENUM('admin', 'view') DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Gateways Table
-- Stores hardware gateway details and status logs.
CREATE TABLE IF NOT EXISTS Gateways (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway_name VARCHAR(100) NOT NULL,
    unit_model VARCHAR(100),
    installation_date DATE,
    longitude DECIMAL(11, 8),
    latitude DECIMAL(10, 8),
    status ENUM('online', 'offline') DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Devices (Nodes) Table
-- Stores end-device sensors linked to a gateway and assigned to a specific view-only user.
CREATE TABLE IF NOT EXISTS Devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_gateway INT,
    id_user_owner INT, -- Assigned view-only user who owns/sees this node
    device_name VARCHAR(100) NOT NULL,
    merk VARCHAR(100),
    installation_date DATE,
    longitude DECIMAL(11, 8),
    latitude DECIMAL(10, 8),
    status ENUM('active', 'inactive') DEFAULT 'inactive',
    assignment ENUM('assigned', 'unassigned') DEFAULT 'unassigned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_gateway) REFERENCES Gateways(id) ON DELETE SET NULL,
    FOREIGN KEY (id_user_owner) REFERENCES Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TelemetryLogs Table
-- Stores time-series data reported by devices.
CREATE TABLE IF NOT EXISTS TelemetryLogs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_device INT NOT NULL,
    timestamp DATETIME NOT NULL,
    gas DECIMAL(10, 2) DEFAULT 0.00,
    water DECIMAL(10, 2) DEFAULT 0.00,
    electricity_non_ct DECIMAL(10, 2) DEFAULT 0.00,
    electricity_ct DECIMAL(10, 2) DEFAULT 0.00,
    rtu_kwh_total DECIMAL(10, 2) DEFAULT 0.00,
    INDEX idx_device_timestamp (id_device, timestamp),
    FOREIGN KEY (id_device) REFERENCES Devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- INITIAL SEED DATA (For Testing in MySQL)
-- =========================================================================

-- Seed Users (Passwords represent bcrypt hashes for "admin123" and "user123" respectively)
INSERT INTO Users (id, company_name, location, username, password, role) VALUES
(1, 'Admin IoT Corp', 'Jakarta, Indonesia', 'admin', '$2b$10$qp/9byOhuN7KLBYkSeP6GO.yOucOccBeqkdezT3Po3Yh7L2HdjV4a', 'admin'),
(2, 'PT Sumber Air', 'Surabaya, Indonesia', 'user_air', '$2b$10$quCxSAFiIYO2JmWn5plLP..YIIdQNdh5n9ydWIAO3g6ot7dARG.Aq', 'view'),
(3, 'PT Gas Lestari', 'Bandung, Indonesia', 'user_gas', '$2b$10$quCxSAFiIYO2JmWn5plLP..YIIdQNdh5n9ydWIAO3g6ot7dARG.Aq', 'view');

-- Seed Gateways
INSERT INTO Gateways (id, gateway_name, unit_model, installation_date, longitude, latitude, status) VALUES
(1, 'GW-Main-Office', 'GW-V2.1-PRO', '2026-01-15', 106.827153, -6.175392, 'online'),
(2, 'GW-Factory-1', 'GW-V2.1-PRO', '2026-02-10', 106.806038, -6.229746, 'online'),
(3, 'GW-Warehouse-A', 'GW-V1.5-BASIC', '2026-03-01', 112.752090, -7.257472, 'offline');

-- Seed Devices
INSERT INTO Devices (id, id_gateway, id_user_owner, device_name, merk, installation_date, longitude, latitude, status, assignment) VALUES
(1, 1, 2, 'Node-Flow-Sensor-01', 'FlowTech', '2026-01-16', 106.828500, -6.176000, 'active', 'assigned'),
(2, 1, 2, 'Node-Pressure-Sensor-02', 'PressMax', '2026-01-18', 106.825900, -6.174500, 'active', 'assigned'),
(3, 2, 3, 'Node-Gas-Detector-01', 'GasGuard', '2026-02-11', 106.807500, -6.231000, 'active', 'assigned'),
(4, 3, NULL, 'Node-Power-Meter-01', 'Schneider', '2026-03-02', 112.753500, -7.259000, 'inactive', 'unassigned');

-- Seed Sample Telemetry Logs (Today's hours)
INSERT INTO TelemetryLogs (id_device, timestamp, gas, water, electricity_non_ct, electricity_ct, rtu_kwh_total) VALUES
(1, NOW() - INTERVAL 5 HOUR, 0.00, 24.50, 0.00, 0.00, 0.00),
(1, NOW() - INTERVAL 4 HOUR, 0.00, 28.10, 0.00, 0.00, 0.00),
(1, NOW() - INTERVAL 3 HOUR, 0.00, 31.40, 0.00, 0.00, 0.00),
(1, NOW() - INTERVAL 2 HOUR, 0.00, 29.80, 0.00, 0.00, 0.00),
(1, NOW() - INTERVAL 1 HOUR, 0.00, 33.20, 0.00, 0.00, 0.00),
(2, NOW() - INTERVAL 5 HOUR, 0.00, 0.00, 150.30, 280.40, 430.70),
(2, NOW() - INTERVAL 4 HOUR, 0.00, 0.00, 162.10, 295.20, 457.30),
(2, NOW() - INTERVAL 3 HOUR, 0.00, 0.00, 158.40, 290.10, 448.50),
(2, NOW() - INTERVAL 2 HOUR, 0.00, 0.00, 170.80, 312.00, 482.80),
(2, NOW() - INTERVAL 1 HOUR, 0.00, 0.00, 165.50, 305.60, 471.10),
(3, NOW() - INTERVAL 5 HOUR, 12.30, 0.00, 0.00, 0.00, 0.00),
(3, NOW() - INTERVAL 4 HOUR, 15.60, 0.00, 0.00, 0.00, 0.00),
(3, NOW() - INTERVAL 3 HOUR, 14.10, 0.00, 0.00, 0.00, 0.00),
(3, NOW() - INTERVAL 2 HOUR, 18.20, 0.00, 0.00, 0.00, 0.00),
(3, NOW() - INTERVAL 1 HOUR, 16.90, 0.00, 0.00, 0.00, 0.00);
