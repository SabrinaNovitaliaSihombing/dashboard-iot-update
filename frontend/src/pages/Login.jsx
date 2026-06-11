import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Cpu, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Background Artful Ambient Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] animate-pulse duration-[12000ms]"></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]"></div>

      {/* Main Premium Card Wrapper with Gradient Border Effect */}
      <div className="w-full max-w-md p-[1px] bg-gradient-to-br from-blue-500/30 via-slate-800 to-purple-500/30 rounded-3xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)] relative z-10 backdrop-blur-xl">
        <div className="bg-slate-900/90 rounded-[23px] p-8 md:p-10">
          
          {/* Brand Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-3.5 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 text-blue-400 rounded-2xl mb-4 border border-blue-500/25 shadow-inner animate-pulse">
              <Cpu className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-widest bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              IoT MONITORING
            </h2>
            <p className="text-slate-400 text-xs font-semibold mt-2 tracking-wide uppercase">
              Sensor & Telemetry Platform
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <User className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:outline-none focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder:text-slate-600 hover:border-slate-700/50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:outline-none focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder:text-slate-600 hover:border-slate-700/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white rounded-2xl py-3.5 text-sm font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/15 disabled:opacity-50 hover:shadow-blue-500/25 active:scale-[0.99]"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts Panel */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">
              Demo Access Accounts
            </h4>
            <div className="grid grid-cols-2 gap-3.5 text-[11px]">
              {/* Admin Demo */}
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-950/70">
                <span className="text-blue-400 font-extrabold tracking-wide uppercase text-[9px] block mb-1">
                  Admin Role
                </span>
                <p className="text-slate-400 font-medium truncate">User: <strong className="text-slate-200 font-semibold">admin</strong></p>
                <p className="text-slate-400 font-medium truncate">Pass: <strong className="text-slate-200 font-semibold">admin123</strong></p>
              </div>
              
              {/* Viewer Demo */}
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl transition-all duration-300 hover:border-purple-500/30 hover:bg-slate-950/70">
                <span className="text-purple-400 font-extrabold tracking-wide uppercase text-[9px] block mb-1">
                  View Role
                </span>
                <p className="text-slate-400 font-medium truncate">User: <strong className="text-slate-200 font-semibold">user_air</strong></p>
                <p className="text-slate-400 font-medium truncate">Pass: <strong className="text-slate-200 font-semibold">user123</strong></p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
