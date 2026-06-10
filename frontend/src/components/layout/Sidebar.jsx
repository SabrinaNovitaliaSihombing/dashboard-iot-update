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
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div className="flex flex-col">
        {/* Logo / Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <span className="font-extrabold text-lg text-white tracking-wider">IoT SENSORS</span>
        </div>

        {/* User Quick Info */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <p className="text-sm font-semibold text-slate-200 truncate">{user.company_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-xs text-slate-400 capitalize font-medium">{user.role} Account</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1">
          {/* Dashboard (All roles) */}
          <NavLink 
            to="/dashboard"
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </NavLink>

          {/* ADMIN ONLY MENU */}
          {user.role === 'admin' && (
            <>
              {/* Installation Dropdown Group */}
              <div>
                <button 
                  onClick={() => setInstallationOpen(!installationOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition-all text-slate-400"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span>Installation</span>
                  </div>
                  {installationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {installationOpen && (
                  <div className="pl-8 mt-1 space-y-1">
                    <NavLink 
                      to="/installation/gateways"
                      className={({ isActive }) => 
                        `flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-500' 
                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                        }`
                      }
                    >
                      <Router className="w-4 h-4" />
                      Gateways
                    </NavLink>
                    <NavLink 
                      to="/installation/tenants"
                      className={({ isActive }) => 
                        `flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-500' 
                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                        }`
                      }
                    >
                      <Store className="w-4 h-4" />
                      Tenants
                    </NavLink>
                    <NavLink 
                      to="/installation/nodes"
                      className={({ isActive }) => 
                        `flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-500' 
                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                        }`
                      }
                    >
                      <Server className="w-4 h-4" />
                      Nodes / Devices
                    </NavLink>
                  </div>
                )}
              </div>

              {/* User Management */}
              <NavLink 
                to="/users"
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Users className="w-5 h-5" />
                User Management
              </NavLink>

              {/* Simulator */}
              <NavLink 
                to="/simulator"
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Activity className="w-5 h-5" />
                Simulator
              </NavLink>
            </>
          )}

          {/* VIEW ONLY MENU */}
          {user.role === 'view' && (
            <NavLink 
              to="/my-devices"
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Server className="w-5 h-5" />
              My Devices
            </NavLink>
          )}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-500/10 hover:text-red-500 transition-all text-slate-400"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
