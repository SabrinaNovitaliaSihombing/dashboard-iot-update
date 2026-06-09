import React, { useState, useEffect, useMemo } from 'react';
import { deviceService, gatewayService, userService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Zap, Droplets, Server, AlertTriangle, ChevronDown,
  ToggleLeft, ToggleRight, Activity, TrendingUp, Layers
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const DEVICE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

/** Generate deterministic daily telemetry for a device (last 30 days) */
function genDailyData(deviceId) {
  const days = [];
  const seed = deviceId * 137;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const r = (n) => parseFloat(((Math.sin(seed + i + n) * 0.5 + 0.5) * n + n * 0.2).toFixed(2));
    days.push({
      date: label,
      water: r(60),      // m³
      electricity: r(180) // kWh
    });
  }
  return days;
}

/** Compute today's totals */
function todayUsage(data) {
  const last = data[data.length - 1];
  return { water: last.water, electricity: last.electricity };
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs shadow-xl min-w-[160px]">
      <p className="text-slate-300 font-bold mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value} {p.name.toLowerCase().includes('water') ? 'm³' : 'kWh'}
        </p>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Simulator = () => {
  const [devices, setDevices] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local override: deviceId -> true(active) / false(inactive)
  const [activeOverrides, setActiveOverrides] = useState({});

  // Chart state
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [chartMetric, setChartMetric] = useState('both'); // 'water' | 'electricity' | 'both'
  const [openDropdown, setOpenDropdown] = useState(null); // deviceId or null

  const { markDeviceDeactivated, markDeviceActivated } = useNotification();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dData, gData, uData] = await Promise.all([
          deviceService.getAll(),
          gatewayService.getAll(),
          userService.getAll()
        ]);
        setDevices(dData);
        setGateways(gData);
        setUsers(uData);
        // Init overrides: all active
        const init = {};
        dData.forEach(d => { init[d.id] = true; });
        setActiveOverrides(init);
      } catch (e) {
        console.error(e);
        setError('Failed to load device data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getGatewayName = (id) => gateways.find(g => g.id === id)?.gateway_name || '—';
  const getOwnerName  = (id) => users.find(u => u.id === id)?.company_name || 'Unassigned';
  const getDeviceName = (id) => devices.find(d => d.id === id)?.device_name || `Device ${id}`;

  const toggleDevice = (id) => {
    setActiveOverrides(prev => ({ ...prev, [id]: !prev[id] }));
    setOpenDropdown(null);
  };

  const deactivateDevice = (id) => {
    setActiveOverrides(prev => ({ ...prev, [id]: false }));
    setOpenDropdown(null);
    markDeviceDeactivated(id, getDeviceName(id));
  };

  const activateDevice = (id) => {
    setActiveOverrides(prev => ({ ...prev, [id]: true }));
    setOpenDropdown(null);
    markDeviceActivated(id, getDeviceName(id));
  };

  // Pre-generate telemetry keyed by device id
  const telemetryMap = useMemo(() => {
    const map = {};
    devices.forEach(d => { map[d.id] = genDailyData(d.id); });
    return map;
  }, [devices]);

  // Chart data
  const chartData = useMemo(() => {
    if (selectedDevice === 'all') {
      // Combined: sum across all active devices (30 days)
      if (!devices.length) return [];
      const dates = telemetryMap[devices[0]?.id]?.map(d => d.date) || [];
      return dates.map((date, i) => {
        const row = { date };
        devices.forEach((dev) => {
          if (!activeOverrides[dev.id]) return;
          const d = telemetryMap[dev.id]?.[i];
          if (!d) return;
          const shortName = dev.device_name.replace('Node-', '').replace('-0', ' ');
          row[`${shortName}_water`]       = d.water;
          row[`${shortName}_electricity`] = d.electricity;
        });
        return row;
      });
    } else {
      return telemetryMap[parseInt(selectedDevice)] || [];
    }
  }, [selectedDevice, devices, telemetryMap, activeOverrides]);

  // Combined chart series keys (for "all" mode)
  const allSeriesKeys = useMemo(() => {
    if (selectedDevice !== 'all' || !chartData.length) return [];
    const keys = Object.keys(chartData[0]).filter(k => k !== 'date');
    return keys;
  }, [chartData, selectedDevice]);

  const inactiveDevices = devices.filter(d => activeOverrides[d.id] === false);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold mt-4">Loading simulator...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-semibold text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Activity className="w-7 h-7 text-indigo-500" />
          Device Simulator
        </h1>
        <p className="text-slate-400 text-sm font-semibold mt-1">
          Monitor daily consumption, toggle device states, and analyse usage charts
        </p>
      </div>

      {/* ── Warning Banner ── */}
      {inactiveDevices.length > 0 && (
        <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-700 font-bold text-sm">
              {inactiveDevices.length} device{inactiveDevices.length > 1 ? 's' : ''} currently deactivated
            </p>
            <p className="text-amber-600 text-xs font-medium mt-0.5">
              {inactiveDevices.map(d => d.device_name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Device Table ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-700 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Device Status & Daily Usage
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{devices.length} devices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Device Name</th>
                <th className="px-6 py-4">Gateway</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">
                  <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-cyan-500" /> Water Today (m³)</span>
                </th>
                <th className="px-6 py-4">
                  <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Electricity Today (kWh)</span>
                </th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No devices found.
                  </td>
                </tr>
              ) : (
                devices.map((dev) => {
                  const isActive = activeOverrides[dev.id] !== false;
                  const usage = todayUsage(telemetryMap[dev.id] || [{ water: 0, electricity: 0 }]);
                  return (
                    <tr key={dev.id} className={`transition-colors ${isActive ? 'hover:bg-slate-50/60' : 'bg-slate-50/40 opacity-60'}`}>
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                            <Server className="w-4 h-4" />
                          </div>
                          {dev.device_name}
                        </div>
                      </td>
                      {/* Gateway */}
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-600 font-bold">
                          {getGatewayName(dev.id_gateway)}
                        </span>
                      </td>
                      {/* Owner */}
                      <td className="px-6 py-4 text-blue-600">{getOwnerName(dev.id_user_owner)}</td>
                      {/* Water */}
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="flex items-center gap-1.5 text-cyan-600 font-bold">
                            <Droplets className="w-4 h-4" />
                            {usage.water.toFixed(2)} m³
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      {/* Electricity */}
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                            <Zap className="w-4 h-4" />
                            {usage.electricity.toFixed(2)} kWh
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-200 text-slate-500 border border-slate-300'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {/* Toggle Dropdown */}
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === dev.id ? null : dev.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                              isActive
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            {isActive ? 'Active' : 'Inactive'}
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {openDropdown === dev.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
                              <button
                                onClick={() => activateDevice(dev.id)}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-left hover:bg-emerald-50 text-emerald-700 transition-colors ${isActive ? 'bg-emerald-50' : ''}`}
                              >
                                <ToggleRight className="w-4 h-4" /> Activate
                              </button>
                              <button
                                onClick={() => deactivateDevice(dev.id)}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-left hover:bg-red-50 text-red-500 transition-colors ${!isActive ? 'bg-red-50' : ''}`}
                              >
                                <ToggleLeft className="w-4 h-4" /> Deactivate
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Chart Section ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        {/* Chart Controls */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-extrabold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Usage Chart (Last 30 Days)
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Device Selector */}
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="all">
                All Devices (Combined)
              </option>
              {devices.map(dev => (
                <option key={dev.id} value={dev.id} disabled={!activeOverrides[dev.id]}>
                  {dev.device_name}{!activeOverrides[dev.id] ? ' (Inactive)' : ''}
                </option>
              ))}
            </select>

            {/* Metric Selector (only for single device) */}
            {selectedDevice !== 'all' && (
              <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold">
                {['both', 'water', 'electricity'].map(m => (
                  <button
                    key={m}
                    onClick={() => setChartMetric(m)}
                    className={`px-3 py-2 capitalize transition-colors cursor-pointer ${
                      chartMetric === m ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {m === 'electricity' ? 'kWh' : m === 'water' ? 'Water' : 'Both'}
                  </button>
                ))}
              </div>
            )}

            {/* Chart Type Selector */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-2 transition-colors cursor-pointer ${chartType === 'area' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-2 transition-colors cursor-pointer ${chartType === 'bar' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="p-6">
          {selectedDevice === 'all' ? (
            /* ── Combined View ── */
            <div className="space-y-6">
              {/* Combined Water */}
              {(chartMetric === 'both' || chartMetric === 'water') && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-cyan-500" /> Water Usage (m³) — All Devices
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    {chartType === 'area' ? (
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          {devices.filter(d => activeOverrides[d.id]).map((dev, i) => {
                            const key = dev.device_name.replace('Node-', '').replace('-0', ' ') + '_water';
                            return (
                              <linearGradient key={key} id={`gw_${dev.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={DEVICE_COLORS[i % DEVICE_COLORS.length]} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={DEVICE_COLORS[i % DEVICE_COLORS.length]} stopOpacity={0} />
                              </linearGradient>
                            );
                          })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {devices.filter(d => activeOverrides[d.id]).map((dev, i) => {
                          const key = dev.device_name.replace('Node-', '').replace('-0', ' ') + '_water';
                          return (
                            <Area key={key} type="monotone" dataKey={key} name={dev.device_name.replace('Node-', '')}
                              stroke={DEVICE_COLORS[i % DEVICE_COLORS.length]}
                              fill={`url(#gw_${dev.id})`}
                              strokeWidth={2} dot={false} />
                          );
                        })}
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {devices.filter(d => activeOverrides[d.id]).map((dev, i) => {
                          const key = dev.device_name.replace('Node-', '').replace('-0', ' ') + '_water';
                          return <Bar key={key} dataKey={key} name={dev.device_name.replace('Node-', '')} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} radius={[3, 3, 0, 0]} />;
                        })}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Combined Electricity */}
              {(chartMetric === 'both' || chartMetric === 'electricity') && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Electricity Usage (kWh) — All Devices
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    {chartType === 'area' ? (
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          {devices.filter(d => activeOverrides[d.id]).map((dev, i) => (
                            <linearGradient key={`ge_${dev.id}`} id={`ge_${dev.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={DEVICE_COLORS[i % DEVICE_COLORS.length]} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={DEVICE_COLORS[i % DEVICE_COLORS.length]} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {devices.filter(d => activeOverrides[d.id]).map((dev, i) => {
                          const key = dev.device_name.replace('Node-', '').replace('-0', ' ') + '_electricity';
                          return (
                            <Area key={key} type="monotone" dataKey={key} name={dev.device_name.replace('Node-', '')}
                              stroke={DEVICE_COLORS[i % DEVICE_COLORS.length]}
                              fill={`url(#ge_${dev.id})`}
                              strokeWidth={2} dot={false} />
                          );
                        })}
                      </AreaChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {devices.filter(d => activeOverrides[d.id]).map((dev, i) => {
                          const key = dev.device_name.replace('Node-', '').replace('-0', ' ') + '_electricity';
                          return <Bar key={key} dataKey={key} name={dev.device_name.replace('Node-', '')} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} radius={[3, 3, 0, 0]} />;
                        })}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {devices.filter(d => activeOverrides[d.id]).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Layers className="w-10 h-10 mb-3 opacity-30" />
                  <p className="font-semibold text-sm">All devices are inactive. Activate at least one device to see data.</p>
                </div>
              )}
            </div>
          ) : (
            /* ── Single Device View ── */
            (() => {
              const dev = devices.find(d => d.id === parseInt(selectedDevice));
              const isActive = activeOverrides[parseInt(selectedDevice)] !== false;

              if (!isActive) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <AlertTriangle className="w-10 h-10 mb-3 text-amber-400 opacity-60" />
                    <p className="font-semibold text-sm">This device is currently inactive. Activate it to view usage data.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">{dev?.device_name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{getGatewayName(dev?.id_gateway)} · {getOwnerName(dev?.id_user_owner)}</p>
                    </div>
                  </div>

                  {/* Water Chart */}
                  {(chartMetric === 'both' || chartMetric === 'water') && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Droplets className="w-3.5 h-3.5 text-cyan-500" /> Daily Water Usage (m³)
                      </p>
                      <ResponsiveContainer width="100%" height={220}>
                        {chartType === 'area' ? (
                          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="water" name="Water" stroke="#06b6d4" fill="url(#waterGrad)" strokeWidth={2.5} dot={false} />
                          </AreaChart>
                        ) : (
                          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="water" name="Water" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Electricity Chart */}
                  {(chartMetric === 'both' || chartMetric === 'electricity') && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Daily Electricity Usage (kWh)
                      </p>
                      <ResponsiveContainer width="100%" height={220}>
                        {chartType === 'area' ? (
                          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                              <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="electricity" name="Electricity" stroke="#f59e0b" fill="url(#elecGrad)" strokeWidth={2.5} dot={false} />
                          </AreaChart>
                        ) : (
                          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="electricity" name="Electricity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;
