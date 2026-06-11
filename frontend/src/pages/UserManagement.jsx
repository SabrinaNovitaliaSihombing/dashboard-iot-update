import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Users, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('view');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setCompanyName('');
    setLocation('');
    setUsername('');
    setPassword('');
    setRole('view');
    setIsOpen(true);
  };

  const openEditModal = (user) => {
    setEditingId(user.id);
    setCompanyName(user.company_name);
    setLocation(user.location || '');
    setUsername(user.username);
    setPassword(user.password); // In production, this would be hashed and not populated like this
    setRole(user.role);
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !username || !password) {
      alert("Please fill in Company Name, Username, and Password.");
      return;
    }

    const payload = {
      company_name: companyName,
      location,
      username,
      password,
      role
    };

    try {
      if (editingId) {
        await userService.update(editingId, payload);
      } else {
        await userService.create(payload);
      }
      setIsOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving user record.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user? Devices owned by this user will be set to Unassigned.")) {
      try {
        await userService.delete(id);
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert("Error deleting user record.");
      }
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">Manage corporate clients and user accounts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
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
          <p className="text-slate-400 font-semibold text-sm mt-4">Retrieving users directory...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No users registered yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>{u.company_name}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{u.location || "-"}</td>
                    <td className="px-6 py-4 font-bold text-slate-500">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide text-white ${
                        u.role === 'admin' ? 'bg-red-500' : 'bg-slate-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
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
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingId ? "Edit User Account" : "Register New User"}
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
                <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Company Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. PT Maju Jaya"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Jakarta, Indonesia"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. user_maju"
                    disabled={!!editingId}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-bold mb-1.5 uppercase">Role Privilege</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                    <input 
                      type="radio" 
                      name="role" 
                      value="admin" 
                      checked={role === 'admin'} 
                      onChange={() => setRole('admin')} 
                    />
                    <span className="text-red-500">Admin (Full Access)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm">
                    <input 
                      type="radio" 
                      name="role" 
                      value="view" 
                      checked={role === 'view'} 
                      onChange={() => setRole('view')} 
                    />
                    <span className="text-slate-500">View (Read Only)</span>
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
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
