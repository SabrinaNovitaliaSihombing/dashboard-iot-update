import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

// Page Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GatewayManagement from './pages/Installation/GatewayManagement';
import NodeManagement from './pages/Installation/NodeManagement';
import UserManagement from './pages/UserManagement';
import MyDevices from './pages/MyDevices';

// Main Layout Wrapper
const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'view']}>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin Installation Sub-menu */}
          <Route path="/installation/gateways" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <GatewayManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/installation/nodes" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <NodeManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin User Management */}
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* View Role Specific Pages */}
          <Route path="/my-devices" element={
            <ProtectedRoute allowedRoles={['view']}>
              <DashboardLayout>
                <MyDevices />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Fallback routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
