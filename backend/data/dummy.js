// Dummy Database Store (In-Memory for UI/UX simulation)
// These mimic the database schema layout and relationships

export const initialUsers = [
  {
    id: 1,
    company_name: "Admin IoT Corp",
    location: "Jakarta, Indonesia",
    username: "admin",
    password: "admin123", // In production, this would be hashed
    role: "admin"
  },
  {
    id: 2,
    company_name: "PT Sumber Air",
    location: "Surabaya, Indonesia",
    username: "user_air",
    password: "user123",
    role: "view"
  },
  {
    id: 3,
    company_name: "PT Gas Lestari",
    location: "Bandung, Indonesia",
    username: "user_gas",
    password: "user123",
    role: "view"
  }
];

export const initialGateways = [
  {
    id: 1,
    gateway_name: "GW-Main-Office",
    unit_model: "GW-V2.1-PRO",
    installation_date: "2026-01-15",
    longitude: 106.827153,
    latitude: -6.175392,
    status: "online"
  },
  {
    id: 2,
    gateway_name: "GW-Factory-1",
    unit_model: "GW-V2.1-PRO",
    installation_date: "2026-02-10",
    longitude: 106.806038,
    latitude: -6.229746,
    status: "online"
  },
  {
    id: 3,
    gateway_name: "GW-Warehouse-A",
    unit_model: "GW-V1.5-BASIC",
    installation_date: "2026-03-01",
    longitude: 112.752090,
    latitude: -7.257472,
    status: "offline"
  }
];

export const initialDevices = [
  {
    id: 1,
    id_gateway: 1,
    id_user_owner: 2, // Owned by user_air
    device_name: "Node-Flow-Sensor-01",
    merk: "FlowTech",
    installation_date: "2026-01-16",
    longitude: 106.828500,
    latitude: -6.176000,
    status: "active",
    assignment: "assigned"
  },
  {
    id: 2,
    id_gateway: 1,
    id_user_owner: 2, // Owned by user_air
    device_name: "Node-Pressure-Sensor-02",
    merk: "PressMax",
    installation_date: "2026-01-18",
    longitude: 106.825900,
    latitude: -6.174500,
    status: "active",
    assignment: "assigned"
  },
  {
    id: 3,
    id_gateway: 2,
    id_user_owner: 3, // Owned by user_gas
    device_name: "Node-Gas-Detector-01",
    merk: "GasGuard",
    installation_date: "2026-02-11",
    longitude: 106.807500,
    latitude: -6.231000,
    status: "active",
    assignment: "assigned"
  },
  {
    id: 4,
    id_gateway: 3,
    id_user_owner: null, // Unassigned
    device_name: "Node-Power-Meter-01",
    merk: "Schneider",
    installation_date: "2026-03-02",
    longitude: 112.753500,
    latitude: -7.259000,
    status: "inactive",
    assignment: "unassigned"
  }
];

// Generates hourly telemetry logs for active devices
export const generateTelemetryLogs = () => {
  const logs = [];
  const devices = [1, 2, 3, 4];
  const now = new Date();

  // Create telemetry records for the last 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(now.getDate() - day);

    for (let hour = 0; hour < 24; hour++) {
      date.setHours(hour, 0, 0, 0);

      devices.forEach((id_device) => {
        // Active devices report data, inactive ones have 0 or spotty data
        const isActive = id_device !== 4;
        const multiplier = isActive ? 1 : 0.05;

        logs.push({
          id: logs.length + 1,
          id_device,
          timestamp: date.toISOString(),
          gas: parseFloat((Math.random() * 50 * multiplier).toFixed(2)),
          water: parseFloat((Math.random() * 80 * multiplier).toFixed(2)),
          electricity_non_ct: parseFloat((Math.random() * 200 * multiplier).toFixed(2)),
          electricity_ct: parseFloat((Math.random() * 400 * multiplier).toFixed(2)),
          rtu_kwh_total: parseFloat((Math.random() * 500 * multiplier).toFixed(2))
        });
      });
    }
  }
  return logs;
};
