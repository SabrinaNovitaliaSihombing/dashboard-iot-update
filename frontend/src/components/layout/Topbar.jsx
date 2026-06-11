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
    <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-100/80 flex items-center justify-between px-6 shrink-0 relative z-20 font-sans">
      {/* Greetings */}
      <div className="flex items-center gap-2">
        <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
          Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-black">{user.username}</span>
        </h2>
      </div>

      {/* Profile / Metadata */}
      <div className="flex items-center gap-5">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-bold tracking-wide uppercase">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{today}</span>
        </div>

        {/* Separator */}
        <div className="hidden md:block w-[1px] h-4 bg-slate-100"></div>

        {/* Company Location */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100/70 rounded-full py-1.5 px-3.5 text-xs text-slate-500 font-bold shadow-sm hover:bg-slate-100/50 transition-colors cursor-default">
          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          <span>{user.location || "Location N/A"}</span>
        </div>

        {/* User Avatar Badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-blue-500/10 cursor-pointer transition-transform hover:scale-105 active:scale-95">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
