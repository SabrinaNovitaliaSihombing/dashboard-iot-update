import React, { useState, useEffect } from 'react';
import { deviceService, gatewayService, userService } from '../../services/api';
import { Server, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const NodeManagement = () => {
  const [devices, setDevices] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [deviceName, setDeviceName] = useState('');
  const [merk, setMerk] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [idGateway, setIdGateway] = useState('');
  const [idUserOwner, setIdUserOwner] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dData, gData, uData] = await Promise.all([
        deviceService.getAll(),
        gatewayService.getAll(),
        userService.getAll()
      ]);
      setDevices(dData);
      setGateways(gData);
      // Filter only user with role 'view' for the Owner assignment dropdown
      setUsers(uData.filter(u => u.role === 'view'));
    } catch (err) {
      console.error(err);
      setError("Failed to load installation assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setDeviceName('');
    setMerk('');
    setInstallationDate('');
    setLongitude('');
    setLatitude('');
    setIdGateway('');
    setIdUserOwner('');
    setIsOpen(true);
  };

  const openEditModal = (dev) => {
    setEditingId(dev.id);
    setDeviceName(dev.device_name);
    setMerk(dev.merk || '');
    setInstallationDate(dev.installation_date || '');
    setLongitude(dev.longitude || '');
    setLatitude(dev.latitude || '');
    setIdGateway(dev.id_gateway || '');
    setIdUserOwner(dev.id_user_owner || '');
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deviceName || !longitude || !latitude) {
      alert("Please fill in Device Name, Latitude, and Longitude.");
      return;
    }

    const payload = {
      device_name: deviceName,
      merk,
      installation_date: installationDate || null,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      id_gateway: idGateway ? parseInt(idGateway) : null,
      id_user_owner: idUserOwner ? parseInt(idUserOwner) : null,
      status: 'active'
    };

    try {
      if (editingId) {
        await deviceService.update(editingId, payload);
      } else {
        await deviceService.create(payload);
      }
      setIsOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving device node");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this device node? All telemetry logs linked to this node will be lost.")) {
      try {
        await deviceService.delete(id);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Error deleting device node");
      }
    }
  };

  // Helper mapping names
  const getGatewayName = (gwId) => {
    const gw = gateways.find(g => g.id === gwId);
    return gw ? gw.gateway_name : 'No Gateway';
  };

  const getOwnerName = (ownerId) => {
    const owner = users.find(u => u.id === ownerId);
    return owner ? owner.company_name : 'Unassigned';
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Node / Device Installation</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Configure telemetry nodes and user ownership</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Node</span>
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
          <p className="text-slate-400 font-semibold text-sm mt-4">Retrieving devices list...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Node Name</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Gateway</th>
                <th className="px-6 py-4">Assigned Owner</th>
                <th className="px-6 py-4">Coordinates</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No devices installed yet. Click "Add Node" to create one.
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
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-600 font-bold">
                        {getGatewayName(dev.id_gateway)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">
                      {getOwnerName(dev.id_user_owner)}
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
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(dev)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dev.id)}
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
                {editingId ? "Edit Node Config" : "Register New Node"}
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
                <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Node Device Name *</label>
                <input
                  type="text"
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Node-Water-Flow-04"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Merk (Brand)</label>
                  <input
                    type="text"
                    value={merk}
                    onChange={(e) => setMerk(e.target.value)}
                    placeholder="e.g. Schneider"
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
                    placeholder="-6.2304"
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
                    placeholder="106.8080"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Gateway Dropdown Selector */}
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Gateway Connection</label>
                  <select
                    value={idGateway}
                    onChange={(e) => setIdGateway(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">No Gateway Connection</option>
                    {gateways.map(g => (
                      <option key={g.id} value={g.id}>{g.gateway_name}</option>
                    ))}
                  </select>
                </div>

                {/* Owner Dropdown Selector */}
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Assign Owner (View Role) *</label>
                  <select
                    value={idUserOwner}
                    onChange={(e) => setIdUserOwner(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">Unassigned / Available</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.company_name} ({u.username})</option>
                    ))}
                  </select>
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
                  Save Device Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeManagement;
