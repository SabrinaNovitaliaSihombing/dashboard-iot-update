import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Settings, 
  Router, 
  Server, 
  Users, 
  LogOut, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  Activity,
  Store
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [installationOpen, setInstallationOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="w-64 bg-slate-950 text-slate-400 min-h-screen flex flex-col justify-between border-r border-slate-900 shrink-0 font-sans overflow-hidden">
      <div className="flex flex-col min-h-0 flex-1">
        {/* Logo / Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-900/60 shrink-0">
          <div className="p-2 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)] shrink-0">
            <Cpu className="w-5 h-5 animate-pulse text-blue-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-sm text-white tracking-widest uppercase truncate">IoT SENSORS</span>
            <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">Control Center</span>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="mx-3 my-3 p-3 bg-slate-900/40 border border-slate-900 rounded-xl shrink-0">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Logged in as</p>
          <p className="text-sm font-bold text-white truncate">{user.company_name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-500 capitalize font-bold truncate">{user.role} mode</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-2 py-1 space-y-0.5 overflow-y-auto flex-1">
          {/* Dashboard (All roles) */}
          <NavLink 
            to="/dashboard"
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15' 
                  : 'hover:bg-slate-900/50 hover:text-white text-slate-400'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className="truncate">Dashboard</span>
          </NavLink>

          {/* ADMIN ONLY MENU */}
          {user.role === 'admin' && (
            <>
              {/* Installation Dropdown Group */}
              <div className="space-y-1">
                <button 
                  onClick={() => setInstallationOpen(!installationOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900/30 hover:text-white transition-all text-slate-400"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">Configuration</span>
                  </div>
                  {installationOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                </button>

                {installationOpen && (
                  <div className="pl-4 pr-1 space-y-0.5 border-l border-slate-900 ml-5 py-1">
                    <NavLink 
                      to="/installation/gateways"
                      className={({ isActive }) => 
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          isActive 
                            ? 'bg-slate-900 text-blue-400 border-l-2 border-blue-500' 
                            : 'hover:bg-slate-900/40 hover:text-white text-slate-500'
                        }`
                      }
                    >
                      <Router className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Gateways</span>
                    </NavLink>
                    <NavLink 
                      to="/installation/tenants"
                      className={({ isActive }) => 
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          isActive 
                            ? 'bg-slate-900 text-blue-400 border-l-2 border-blue-500' 
                            : 'hover:bg-slate-900/40 hover:text-white text-slate-500'
                        }`
                      }
                    >
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Tenants</span>
                    </NavLink>
                    <NavLink 
                      to="/installation/nodes"
                      className={({ isActive }) => 
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          isActive 
                            ? 'bg-slate-900 text-blue-400 border-l-2 border-blue-500' 
                            : 'hover:bg-slate-900/40 hover:text-white text-slate-500'
                        }`
                      }
                    >
                      <Server className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Nodes / Devices</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* User Management */}
              <NavLink 
                to="/users"
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15' 
                      : 'hover:bg-slate-900/50 hover:text-white text-slate-400'
                  }`
                }
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">User Management</span>
              </NavLink>

              {/* Simulator */}
              <NavLink 
                to="/simulator"
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/15' 
                      : 'hover:bg-slate-900/50 hover:text-white text-slate-400'
                  }`
                }
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span className="truncate">Simulator View</span>
              </NavLink>
            </>
          )}

          {/* VIEW ONLY MENU */}
          {user.role === 'view' && (
            <NavLink 
              to="/my-devices"
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15' 
                    : 'hover:bg-slate-900/50 hover:text-white text-slate-400'
                }`
              }
            >
              <Server className="w-4 h-4 shrink-0" />
              <span className="truncate">My Assigned Devices</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-2 border-t border-slate-900/60 shrink-0">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-slate-500 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="truncate">Logout Account</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
