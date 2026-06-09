import React, { useState, useEffect } from 'react';
import { gatewayService } from '../../services/api';
import { Router, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const GatewayManagement = () => {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form fields
  const [gatewayName, setGatewayName] = useState('');
  const [unitModel, setUnitModel] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [status, setStatus] = useState('offline');

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const data = await gatewayService.getAll();
      setGateways(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch gateways.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setGatewayName('');
    setUnitModel('');
    setInstallationDate('');
    setLongitude('');
    setLatitude('');
    setStatus('offline');
    setIsOpen(true);
  };

  const openEditModal = (gw) => {
    setEditingId(gw.id);
    setGatewayName(gw.gateway_name);
    setUnitModel(gw.unit_model || '');
    setInstallationDate(gw.installation_date || '');
    setLongitude(gw.longitude || '');
    setLatitude(gw.latitude || '');
    setStatus(gw.status);
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gatewayName || !longitude || !latitude) {
      alert("Please fill in Name, Latitude, and Longitude");
      return;
    }

    const payload = {
      gateway_name: gatewayName,
      unit_model: unitModel,
      installation_date: installationDate || null,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      status
    };

    try {
      if (editingId) {
        await gatewayService.update(editingId, payload);
      } else {
        await gatewayService.create(payload);
      }
      setIsOpen(false);
      fetchGateways();
    } catch (err) {
      console.error(err);
      alert("Error saving gateway");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Gateway? Linked devices will be unassigned.")) {
      try {
        await gatewayService.delete(id);
        fetchGateways();
      } catch (err) {
        console.error(err);
        alert("Error deleting gateway");
      }
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gateway Installation</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Configure and manage hardware gateways</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Gateway</span>
        </button>
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
          <p className="text-slate-400 font-semibold text-sm mt-4">Retrieving gateways list...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Installation Date</th>
                <th className="px-6 py-4">Coordinates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
              {gateways.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No gateways configured. Click "Add Gateway" to create one.
                  </td>
                </tr>
              ) : (
                gateways.map((gw) => (
                  <tr key={gw.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                        <Router className="w-4 h-4" />
                      </div>
                      <span>{gw.gateway_name}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{gw.unit_model || "-"}</td>
                    <td className="px-6 py-4 font-medium">{gw.installation_date || "-"}</td>
                    <td className="px-6 py-4 font-semibold text-slate-500 text-xs">
                      LAT: {gw.latitude ? parseFloat(gw.latitude).toFixed(5) : "-"} <br />
                      LNG: {gw.longitude ? parseFloat(gw.longitude).toFixed(5) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide text-white ${
                        gw.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}>
                        {gw.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(gw)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(gw.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg cursor-pointer transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal CRUD Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingId ? "Edit Gateway Config" : "Register New Gateway"}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Gateway Name *</label>
                <input
                  type="text"
                  required
                  value={gatewayName}
                  onChange={(e) => setGatewayName(e.target.value)}
                  placeholder="e.g. GW-Office-Central"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Unit Model</label>
                  <input
                    type="text"
                    value={unitModel}
                    onChange={(e) => setUnitModel(e.target.value)}
                    placeholder="e.g. GW-V2-PRO"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Installation Date</label>
                  <input
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Latitude *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-6.12345"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Longitude *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="106.12345"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Initial Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                    <input 
                      type="radio" 
                      name="status" 
                      value="online" 
                      checked={status === 'online'} 
                      onChange={() => setStatus('online')} 
                    />
                    <span className="text-emerald-600">Online</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                    <input 
                      type="radio" 
                      name="status" 
                      value="offline" 
                      checked={status === 'offline'} 
                      onChange={() => setStatus('offline')} 
                    />
                    <span className="text-red-500">Offline</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 font-bold text-sm rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl cursor-pointer hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20"
                >
                  Save Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatewayManagement;
