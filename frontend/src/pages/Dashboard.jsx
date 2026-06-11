import React, { useState, useEffect } from 'react';
import { gatewayService, deviceService } from '../services/api';
import PieCharts from '../components/charts/PieCharts';
import HourlyStatsChart from '../components/charts/HourlyStatsChart';
import MapComponent from '../components/maps/MapComponent';
import { Router, Server, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [gateways, setGateways] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gList, dList] = await Promise.all([
          gatewayService.getAll(),
          deviceService.getAll()
        ]);
        setGateways(gList);
        setDevices(dList);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError("Error loading system metrics. Please check if backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-semibold mt-4">Loading monitoring interface...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-slate-50/50">
        <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 animate-bounce" />
          <h3 className="font-bold text-slate-800 text-lg">Failed to load Dashboard</h3>
          <p className="text-sm text-slate-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold shadow hover:bg-red-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const onlineGws = gateways.filter(g => g.status === 'online').length;
  const activeDevs = devices.filter(d => d.status === 'active').length;

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100/60">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            IoT Sensors Overview
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider">
            Real-time status updates and telemetry metrics
          </p>
        </div>
        
        {/* Active Session Indicator */}
        <div className="flex items-center gap-2 self-start md:self-auto px-3.5 py-2 bg-blue-50/50 border border-blue-100/60 rounded-2xl text-[11px] text-blue-600 font-bold">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Live Telemetry Streams Connected</span>
        </div>
      </div>

      {/* Quick Stat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        
        {/* Gateway Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="p-4 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 text-emerald-600 rounded-2xl border border-emerald-500/15 group-hover:scale-105 transition-transform">
            <Router className="w-7 h-7 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Gateways</h4>
            <p className="text-3xl font-black text-slate-800 mt-1.5">{gateways.length}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-500 font-bold">
                {onlineGws} online <span className="text-slate-300 mx-1">·</span> {gateways.length - onlineGws} offline
              </span>
            </div>
          </div>
        </div>

        {/* Device Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="p-4 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 text-blue-600 rounded-2xl border border-blue-500/15 group-hover:scale-105 transition-transform">
            <Server className="w-7 h-7 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Device Nodes</h4>
            <p className="text-3xl font-black text-slate-800 mt-1.5">{devices.length}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-xs text-slate-500 font-bold">
                {activeDevs} active <span className="text-slate-300 mx-1">·</span> {devices.length - activeDevs} inactive
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Map Section */}
      <div className="w-full">
        <MapComponent gateways={gateways} devices={devices} />
      </div>

      {/* Pie Charts Section */}
      <div className="w-full">
        <PieCharts gateways={gateways} devices={devices} />
      </div>

      {/* Line Chart Section */}
      <div className="w-full">
        <HourlyStatsChart />
      </div>
    </div>
  );
};

export default Dashboard;
