import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * LoginAlertBanner – shows a dismissable sticky banner at the top of the
 * main content area when one or more devices were deactivated in a previous
 * (or current) session.
 *
 * The banner appears automatically each time the user logs in (because the
 * data comes from localStorage via NotificationContext).
 */
const LoginAlertBanner = () => {
  const { deactivatedList, hasDeactivatedDevices, clearDeactivatedDevices } = useNotification();

  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  // Reset "dismissed" whenever the list changes (e.g. new login / new deactivation)
  useEffect(() => {
    if (hasDeactivatedDevices) setDismissed(false);
  }, [hasDeactivatedDevices]);

  if (!hasDeactivatedDevices || dismissed) return null;

  const fmt = (iso) =>
    new Date(iso).toLocaleString('id-ID', {
      day:    '2-digit',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-8 py-0 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* ── Header row ── */}
        <div className="flex items-center gap-3 py-3">
          <div className="flex items-center gap-2 flex-1">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span className="text-sm font-bold text-amber-700">
              Peringatan: {deactivatedList.length} device
              {deactivatedList.length > 1 ? 's' : ''} tidak aktif
            </span>
            <span className="text-xs text-amber-600 font-medium hidden sm:inline">
              — Beberapa perangkat telah dinonaktifkan dan tidak mengirim data telemetri.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Expand / collapse device list */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Sembunyikan</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Lihat Detail</>
              )}
            </button>

            {/* Clear all */}
            <button
              onClick={() => { clearDeactivatedDevices(); setDismissed(true); }}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Clear All
            </button>

            {/* Dismiss banner only */}
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-amber-100 rounded-full transition-colors text-amber-500 hover:text-amber-700 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Expandable detail list ── */}
        {expanded && (
          <div className="pb-3 flex flex-wrap gap-2">
            {deactivatedList.map((dev, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-700">{dev.deviceName}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Dinonaktifkan: {fmt(dev.deactivatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginAlertBanner;
