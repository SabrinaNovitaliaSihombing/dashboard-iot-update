import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { telemetryService } from '../../services/api';
import { Activity, AlertCircle } from 'lucide-react';

const HourlyStatsChart = () => {
  const [timeFilter, setTimeFilter] = useState('Today');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      setLoading(true);
      setError(null);
      try {
        const stats = await telemetryService.getStats(timeFilter);
        setData(stats);
      } catch (err) {
        console.error("Failed to load telemetry stats", err);
        setError("Could not retrieve telemetry logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, [timeFilter]);

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-md w-full transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Hourly Telemetry Statistics</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Average parameter logs by the hour (00:00 - 23:00)</p>
          </div>
        </div>

        <select 
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="border border-slate-200 bg-slate-50 text-slate-700 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer shadow-sm"
        >
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="w-full h-80 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Aggregating telemetry logs...</p>
        </div>
      ) : error ? (
        <div className="w-full h-80 flex flex-col items-center justify-center gap-2 text-red-500">
          <AlertCircle className="w-10 h-10" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="w-full h-80 flex items-center justify-center text-slate-400 font-medium">
          No telemetry logs found for the selected filter.
        </div>
      ) : (
        <div className="w-full h-[380px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: '600' }} iconType="circle" />
              
              <Line type="monotone" dataKey="gas" name="GAS" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="water" name="Water" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="electricity_non_ct" name="Elec Non-CT" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="electricity_ct" name="Elec CT" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="rtu_kwh_total" name="RTU Total" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default HourlyStatsChart;
