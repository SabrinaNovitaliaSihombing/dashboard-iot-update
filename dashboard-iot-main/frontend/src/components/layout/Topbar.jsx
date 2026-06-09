import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, User, Calendar } from 'lucide-react';

const Topbar = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      {/* Search / Greetings */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-800">Welcome back, <span className="text-blue-600">{user.username}</span></h2>
      </div>

      {/* Profile / Stats */}
      <div className="flex items-center gap-6">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
        </div>

        {/* Company Location */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full py-1.5 px-3.5 text-xs text-slate-600 font-semibold shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          <span>{user.location || "Location N/A"}</span>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
