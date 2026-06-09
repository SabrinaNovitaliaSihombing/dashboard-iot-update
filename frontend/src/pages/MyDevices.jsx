import React, { useState, useEffect } from 'react';
import { deviceService, gatewayService } from '../services/api';
import { Server, AlertCircle } from 'lucide-react';

const MyDevices = () => {
  const [devices, setDevices] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dData, gData] = await Promise.all([
          deviceService.getAll(),
          gatewayService.getAll()
        ]);
        setDevices(dData);
        setGateways(gData);
      } catch (err) {
        console.error(err);
        setError("Failed to load your devices.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGatewayName = (gwId) => {
    const gw = gateways.find(g => g.id === gwId);
    return gw ? gw.gateway_name : 'No Gateway';
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">My Devices</h1>
        <p className="text-slate-400 text-sm font-semibold mt-1">Directory of hardware sensors registered under your account</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-xl flex items-center gap-2 text-sm font-semibold border border-red-100">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-md">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-semibold text-sm mt-4">Retrieving your devices list...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Device Name</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Installation Date</th>
                <th className="px-6 py-4">Gateway Connection</th>
                <th className="px-6 py-4">Coordinates</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No devices are currently assigned to your account.
                  </td>
                </tr>
              ) : (
                devices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                        <Server className="w-4 h-4" />
                      </div>
                      <span>{dev.device_name}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{dev.merk || "-"}</td>
                    <td className="px-6 py-4 font-medium">{dev.installation_date || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-600 font-bold">
                        {getGatewayName(dev.id_gateway)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500 text-xs">
                      LAT: {dev.latitude ? parseFloat(dev.latitude).toFixed(5) : "-"} <br />
                      LNG: {dev.longitude ? parseFloat(dev.longitude).toFixed(5) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide text-white ${
                        dev.status === 'active' ? 'bg-blue-500' : 'bg-slate-400'
                      }`}>
                        {dev.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyDevices;
