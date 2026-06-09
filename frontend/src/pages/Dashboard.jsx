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
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">IoT Sensors Overview</h1>
        <p className="text-slate-400 text-sm font-semibold mt-1">Real-time status updates and telemetry metrics</p>
      </div>

      {/* Quick Stat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Gateway Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-md flex items-center gap-5 transition-all duration-300 hover:shadow-lg">
          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl">
            <Router className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Gateways</h4>
            <p className="text-3xl font-black text-slate-800 mt-1">{gateways.length}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              <span className="text-emerald-500 font-bold">{onlineGws} online</span> · {gateways.length - onlineGws} offline
            </p>
          </div>
        </div>

        {/* Device Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-md flex items-center gap-5 transition-all duration-300 hover:shadow-lg">
          <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
            <Server className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Nodes</h4>
            <p className="text-3xl font-black text-slate-800 mt-1">{devices.length}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              <span className="text-blue-500 font-bold">{activeDevs} active</span> · {devices.length - activeDevs} inactive
            </p>
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
