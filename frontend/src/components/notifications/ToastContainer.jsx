import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

// ── Icon & colour map ────────────────────────────────────────────────────────
const CONFIG = {
  success: {
    icon: CheckCircle2,
    bar:  'bg-emerald-500',
    bg:   'bg-white border-emerald-200',
    icon_cls: 'text-emerald-500',
    title_cls: 'text-emerald-700',
    msg_cls:   'text-emerald-600',
  },
  warning: {
    icon: AlertTriangle,
    bar:  'bg-amber-500',
    bg:   'bg-white border-amber-200',
    icon_cls: 'text-amber-500',
    title_cls: 'text-amber-700',
    msg_cls:   'text-amber-600',
  },
  error: {
    icon: XCircle,
    bar:  'bg-red-500',
    bg:   'bg-white border-red-200',
    icon_cls: 'text-red-500',
    title_cls: 'text-red-700',
    msg_cls:   'text-red-600',
  },
  info: {
    icon: Info,
    bar:  'bg-blue-500',
    bg:   'bg-white border-blue-200',
    icon_cls: 'text-blue-500',
    title_cls: 'text-blue-700',
    msg_cls:   'text-blue-600',
  },
};

// ── Single Toast Item ─────────────────────────────────────────────────────────
const ToastItem = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const cfg = CONFIG[toast.type] || CONFIG.info;
  const Icon = cfg.icon;

  // Mount → slide in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 w-80 border rounded-2xl shadow-xl p-4 relative overflow-hidden
        transition-all duration-300 ease-out
        ${cfg.bg}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      {/* Coloured left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cfg.bar}`} />

      {/* Icon */}
      <div className={`shrink-0 mt-0.5 ${cfg.icon_cls}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${cfg.title_cls}`}>{toast.title}</p>
        <p className={`text-xs font-medium mt-0.5 leading-relaxed ${cfg.msg_cls}`}>
          {toast.message}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={handleClose}
        className="shrink-0 p-0.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Toast Container ───────────────────────────────────────────────────────────
const ToastContainer = () => {
  const { toasts, dismissToast } = useNotification();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
