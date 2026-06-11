import React, { useState, useEffect, useRef } from 'react';
import { tenantService } from '../../services/api';
import { Store, Plus, Edit2, Trash2, X, AlertCircle, Upload, Image } from 'lucide-react';

const ALLOCATION_TYPES = ['Single Phase', 'Three Phase', 'Mixed', 'Industrial', 'Commercial'];

const emptyForm = {
  tenant_name: '',
  company_name: '',
  password: '',
  address: '',
  billing_address: '',
  email: '',
  username: '',
  phone: '',
  handphone: '',
  allocation_node_type: '',
  description: '',
};

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tData = await tenantService.getAll();
      setTenants(tData);
    } catch (err) {
      console.error(err);
      setError("Failed to load tenant assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreateModal = () => {
    setEditingId(null);
    resetForm();
    setIsOpen(true);
  };

  const openEditModal = (tenant) => {
    setEditingId(tenant.id);
    setForm({
      tenant_name: tenant.tenant_name || '',
      company_name: tenant.company_name || '',
      password: '',
      address: tenant.address || '',
      billing_address: tenant.billing_address || '',
      email: tenant.email || '',
      username: tenant.username || '',
      phone: tenant.phone || '',
      handphone: tenant.handphone || '',
      allocation_node_type: tenant.allocation_node_type || '',
      description: tenant.description || '',
    });
    setPhotoFile(null);
    setPhotoPreview(tenant.photo ? `http://localhost:5005${tenant.photo}` : null);
    setIsOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      alert('Image must be smaller than 1MB');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tenant_name) {
      alert("Please fill in the Tenant Name.");
      return;
    }

    // Use FormData to support file upload
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val !== '') formData.append(key, val);
    });
    if (photoFile) formData.append('photo', photoFile);

    try {
      if (editingId) {
        await tenantService.updateForm(editingId, formData);
      } else {
        await tenantService.createForm(formData);
      }
      setIsOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving tenant. Please check all fields.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tenant? Devices assigned to this tenant will be unassigned.")) {
      try {
        await tenantService.delete(id);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Error deleting tenant");
      }
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tenant Management</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Configure mall booths, their parent gateways, and telemetry status</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tenant Booth</span>
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
          <p className="text-slate-400 font-semibold text-sm mt-4">Retrieving tenants list...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Tenant / Company</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Node Type</th>
                <th className="px-6 py-4">Active Power (kW)</th>
                <th className="px-6 py-4">Current (A)</th>
                <th className="px-6 py-4">Voltage (V)</th>
                <th className="px-6 py-4">kWh Total</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No tenant booths registered yet. Click "Add Tenant Booth" to create one.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-3">
                        {t.photo ? (
                          <img
                            src={`http://localhost:5005${t.photo}`}
                            alt={t.tenant_name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                            <Store className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span>{t.tenant_name}</span>
                          {t.company_name && <span className="block text-xs font-semibold text-slate-400">{t.company_name}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500">
                        {t.email && <div>{t.email}</div>}
                        {t.phone && <div>{t.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{t.allocation_node_type || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {t.active_power !== null ? `${parseFloat(t.active_power).toFixed(2)} kW` : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {t.current_val !== null ? `${parseFloat(t.current_val).toFixed(2)} A` : '-'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {t.voltage !== null ? `${parseFloat(t.voltage).toFixed(1)} V` : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {t.rtu_kwh_total !== null ? `${parseFloat(t.rtu_kwh_total).toFixed(2)} kWh` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
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
        </div>
      )}

      {/* Modal CRUD Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingId ? "Edit Tenant Config" : "Register New Tenant Booth"}
              </h3>
              <button
                onClick={() => { setIsOpen(false); resetForm(); }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto">
              <div className="p-6">
                <div className="flex gap-6">
                  {/* LEFT — Photo Upload */}
                  <div className="shrink-0">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Upload Photo</p>
                    <p className="text-xs text-slate-400 mb-3">Change your logo Image that appears throughout the app.</p>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-36 h-36 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden relative"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="w-7 h-7 text-slate-400 mb-1" />
                          <span className="text-xs text-slate-400 text-center px-2">Upload Image must smaller than 1mb</span>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>

                  {/* RIGHT — Form Fields Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {/* Tenant Name */}
                    <div>
                      <label className="block text-xs font-bold text-red-500 mb-1">Tenant Name *</label>
                      <input
                        name="tenant_name"
                        type="text"
                        required
                        value={form.tenant_name}
                        onChange={handleChange}
                        placeholder="Tenant Name"
                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                      />
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
                      <input
                        name="company_name"
                        type="text"
                        value={form.company_name}
                        onChange={handleChange}
                        placeholder="Company Name"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-red-500 mb-1">Password {!editingId && '*'}</label>
                      <input
                        name="password"
                        type="password"
                        required={!editingId}
                        value={form.password}
                        onChange={handleChange}
                        placeholder={editingId ? "Leave blank to keep current" : "Password"}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                      />
                    </div>

                    {/* Billing Address */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Billing Address</label>
                      <input
                        name="billing_address"
                        type="text"
                        value={form.billing_address}
                        onChange={handleChange}
                        placeholder="Billing Address"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-xs font-bold text-red-500 mb-1">Address *</label>
                      <input
                        name="address"
                        type="text"
                        required
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Address"
                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                      />
                    </div>

                    {/* Allocation Node Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Allocation Node Type</label>
                      <select
                        name="allocation_node_type"
                        value={form.allocation_node_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all cursor-pointer"
                      >
                        <option value="">Allocation Node Type</option>
                        {ALLOCATION_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-xs font-bold text-red-500 mb-1">Username *</label>
                      <input
                        name="username"
                        type="text"
                        required
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Username"
                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-red-500 mb-1">Phone *</label>
                      <input
                        name="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Phone"
                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                      />
                    </div>

                    {/* Handphone */}
                    <div>
                      <label className="block text-xs font-bold text-red-500 mb-1">Handphone *</label>
                      <input
                        name="handphone"
                        type="tel"
                        required
                        value={form.handphone}
                        onChange={handleChange}
                        placeholder="Handphone"
                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); resetForm(); }}
                  className="px-5 py-2 border border-slate-200 text-slate-500 font-bold text-sm rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 text-white font-bold text-sm rounded-lg cursor-pointer hover:bg-green-500 transition-all shadow-md shadow-green-500/20"
                >
                  save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
