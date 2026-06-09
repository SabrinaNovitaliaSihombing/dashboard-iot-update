import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext(null);

// Key used to persist deactivated device info across sessions
const STORAGE_KEY = 'iot_deactivated_devices';

export const NotificationProvider = ({ children }) => {
  // Toast queue: [{ id, type, title, message }]
  const [toasts, setToasts] = useState([]);

  // Persisted deactivated devices: { [deviceId]: { deviceName, deactivatedAt } }
  const [deactivatedDevices, setDeactivatedDevices] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deactivatedDevices));
  }, [deactivatedDevices]);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((type, title, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Device state helpers ───────────────────────────────────────────────────
  const markDeviceDeactivated = useCallback((deviceId, deviceName) => {
    setDeactivatedDevices(prev => ({
      ...prev,
      [deviceId]: {
        deviceName,
        deactivatedAt: new Date().toISOString(),
      }
    }));
    addToast(
      'warning',
      'Device Deactivated',
      `"${deviceName}" telah dinonaktifkan dan tidak akan mengirim data telemetri.`,
      6000
    );
  }, [addToast]);

  const markDeviceActivated = useCallback((deviceId, deviceName) => {
    setDeactivatedDevices(prev => {
      const next = { ...prev };
      delete next[deviceId];
      return next;
    });
    addToast(
      'success',
      'Device Activated',
      `"${deviceName}" kembali aktif dan siap mengirim data.`,
      5000
    );
  }, [addToast]);

  const clearDeactivatedDevices = useCallback(() => {
    setDeactivatedDevices({});
  }, []);

  const hasDeactivatedDevices = Object.keys(deactivatedDevices).length > 0;
  const deactivatedList = Object.values(deactivatedDevices);

  return (
    <NotificationContext.Provider value={{
      toasts,
      addToast,
      dismissToast,
      deactivatedDevices,
      deactivatedList,
      hasDeactivatedDevices,
      markDeviceDeactivated,
      markDeviceActivated,
      clearDeactivatedDevices,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
