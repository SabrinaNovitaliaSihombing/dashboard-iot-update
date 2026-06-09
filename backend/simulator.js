import pool from './config/db.js';

// Konfigurasi Simulasi
const INTERVAL_MS = 5 * 60 * 1000; // Jalankan setiap 5 menit sesuai permintaan

// Helper untuk menghasilkan nilai acak desimal
function getRandomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Helper untuk MENGUNCI zona waktu ke WITA (UTC+8) secara absolut
// Ini mencegah Windows mencampuradukkan waktu lokal (WIB/WITA) dengan format UTC
function getWitaDateComponents(date) {
  // Tambahkan 8 jam (WITA) dari waktu murni UTC (Epoch)
  const witaEpoch = date.getTime() + (8 * 60 * 60 * 1000);
  const witaDate = new Date(witaEpoch);
  return {
    year: witaDate.getUTCFullYear(),
    month: witaDate.getUTCMonth() + 1,
    day: witaDate.getUTCDate(),
    hour: witaDate.getUTCHours(),
    minute: witaDate.getUTCMinutes(),
    second: witaDate.getUTCSeconds()
  };
}

function getWitaTimeString(date) {
  const c = getWitaDateComponents(date);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${c.year}-${pad(c.month)}-${pad(c.day)} ${pad(c.hour)}:${pad(c.minute)}:${pad(c.second)}`;
}

// Helper untuk mendapatkan faktor pengali (multiplier) berdasarkan jam Mall (WITA)
// Mall Buka Jam 10:00, Tutup Jam 22:00
function getMallMultiplier(hour) {
  if (hour >= 0 && hour < 8) {
    // Malam/Dini hari: Mall tutup total (hanya lampu dasar/kulkas)
    return getRandomFloat(0.05, 0.1);
  } else if (hour >= 8 && hour < 10) {
    // Persiapan buka: Karyawan datang, AC mulai dinyalakan perlahan
    return getRandomFloat(0.3, 0.5);
  } else if (hour >= 10 && hour <= 22) {
    // Jam Operasional Penuh (Peak Hours) - Berjalan dari jam 10 pagi hingga jam 10 malam penuh
    return getRandomFloat(0.9, 1.2);
  } else if (hour > 22 && hour < 24) {
    // Jam 23:00 - 24:00: Persiapan tutup & Mall baru tutup
    return getRandomFloat(0.2, 0.4);
  } else {
    return 0.1;
  }
}

// Simulasi nilai akumulasi kWh total untuk perangkat listrik
let deviceKwhAccumulator = {
  1: 150.00, // Device 1 (Air)
  2: 320.00, // Device 2 (Listrik)
  3: 50.00,  // Device 3 (Gas)
  4: 1000.00 // Device 4 (Power Meter Listrik)
};

/**
 * 1. Fungsi Seed Data Historis (30 Hari ke belakang)
 */
async function seedHistoricalDataIfNeeded() {
  try {
    console.log('🔄 Mereset data log lama untuk menyesuaikan dengan zona waktu absolut WITA (UTC+8)...');
    await pool.query('TRUNCATE TABLE TelemetryLogs');

    console.log('🔄 Memulai seeding data historis 30 hari dengan pola Mall (WITA)...');
    const now = new Date();
    const batchValues = [];

    // Hasilkan data per jam selama 30 hari ke belakang untuk semua device
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(now.getDate() - day);

      for (let hour = 0; hour < 24; hour++) {
        // Kita ciptakan waktu UTC palsu lalu kita paksakan jamnya sesuai WITA
        const recordDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour - 8, 0, 0));
        
        // Dapatkan string waktu WITA yang benar
        const timestampStr = getWitaTimeString(recordDate);
        
        // Ambil multiplier berdasarkan jam (WITA)
        const mallMultiplier = getMallMultiplier(hour);

        for (let devId = 1; devId <= 4; devId++) {
          const isPowerMeter = devId === 4 || devId === 2;
          const isWater = devId === 1;
          const isGas = devId === 3;

          const gas = isGas ? (getRandomFloat(5, 10) * mallMultiplier) : 0.00;
          const water = isWater ? (getRandomFloat(10, 20) * mallMultiplier) : 0.00;
          const elecNonCt = isPowerMeter ? (getRandomFloat(80, 100) * mallMultiplier) : 0.00;
          const elecCt = isPowerMeter ? (getRandomFloat(150, 200) * mallMultiplier) : 0.00;
          
          if (isPowerMeter) {
            deviceKwhAccumulator[devId] += (getRandomFloat(0.5, 1.0) * mallMultiplier);
          }

          batchValues.push([
            devId,
            timestampStr,
            parseFloat(gas.toFixed(2)),
            parseFloat(water.toFixed(2)),
            parseFloat(elecNonCt.toFixed(2)),
            parseFloat(elecCt.toFixed(2)),
            isPowerMeter ? parseFloat(deviceKwhAccumulator[devId].toFixed(2)) : 0.00
          ]);
        }
      }
    }

    console.log(`📦 Memasukkan ${batchValues.length} baris log pola Mall (WITA) ke database...`);
    
    const chunkSize = 500;
    for (let i = 0; i < batchValues.length; i += chunkSize) {
      const chunk = batchValues.slice(i, i + chunkSize);
      await pool.query(
        'INSERT INTO TelemetryLogs (id_device, timestamp, gas, water, electricity_non_ct, electricity_ct, rtu_kwh_total) VALUES ?',
        [chunk]
      );
    }

    console.log('✅ Seeding pola Mall (WITA) selesai! Grafik dashboard Anda siap digunakan.');
  } catch (error) {
    console.error('❌ Gagal men-seed data historis:', error.message);
  }
}

/**
 * 2. Fungsi Simulasi Real-Time dengan Cek Status Aktif/Inaktif
 */
async function runRealTimeSimulationCycle() {
  try {
    const [devices] = await pool.query('SELECT id, device_name, status FROM Devices');
    const now = new Date();
    
    // Gunakan format Absolut WITA (UTC+8)
    const timestamp = getWitaTimeString(now);
    const witaComponents = getWitaDateComponents(now);
    const currentHourWita = witaComponents.hour;
    
    // Dapatkan multiplier berdasarkan jam WITA saat ini
    const mallMultiplier = getMallMultiplier(currentHourWita);

    console.log(`\n=================== SIKLUS SIMULASI MALL [${timestamp} WITA | Jam: ${currentHourWita}:00] ===================`);
    console.log(`Faktor Pemakaian Jam Ini: ${(mallMultiplier * 100).toFixed(0)}% (Kapasitas Mall)`);

    for (const dev of devices) {
      const { id, device_name, status } = dev;

      if (status !== 'active') {
        console.log(`🔴 Device ID ${id} (${device_name}) berstatus [INACTIVE/OFF] -> Dilewati.`);
        continue;
      }

      const isPowerMeter = id === 4 || id === 2;
      const isWater = id === 1;
      const isGas = id === 3;

      const gas = isGas ? (getRandomFloat(1, 3) * mallMultiplier) : 0.00;
      const water = isWater ? (getRandomFloat(2, 5) * mallMultiplier) : 0.00;
      const elecNonCt = isPowerMeter ? (getRandomFloat(5, 10) * mallMultiplier) : 0.00;
      const elecCt = isPowerMeter ? (getRandomFloat(10, 20) * mallMultiplier) : 0.00;
      
      let rtuKwhTotal = 0.00;
      if (isPowerMeter) {
        const usageThisCycle = getRandomFloat(0.1, 0.3) * mallMultiplier;
        deviceKwhAccumulator[id] += usageThisCycle;
        rtuKwhTotal = parseFloat(deviceKwhAccumulator[id].toFixed(2));
      }

      await pool.query(
        `INSERT INTO TelemetryLogs (id_device, timestamp, gas, water, electricity_non_ct, electricity_ct, rtu_kwh_total) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, timestamp, parseFloat(gas.toFixed(2)), parseFloat(water.toFixed(2)), parseFloat(elecNonCt.toFixed(2)), parseFloat(elecCt.toFixed(2)), rtuKwhTotal]
      );

      console.log(`🟢 Device ID ${id} (${device_name}) berstatus [ACTIVE/ON] -> Data Terkirim!`);
    }
    console.log('========================================================================================\n');

  } catch (error) {
    console.error('❌ Gagal menjalankan siklus simulasi:', error.message);
  }
}

// Inisialisasi simulator
async function startSimulator() {
  console.log('🤖 Menyalakan Simulator IoT (Pola Mall - Zona Waktu WITA)...');
  
  // Hubungkan dan buat data historis pola mall
  await seedHistoricalDataIfNeeded();
  
  // Jalankan simulasi real-time pertama kali
  await runRealTimeSimulationCycle();

  // Jalankan berulang setiap interval (5 menit)
  setInterval(runRealTimeSimulationCycle, INTERVAL_MS);
}

startSimulator();
