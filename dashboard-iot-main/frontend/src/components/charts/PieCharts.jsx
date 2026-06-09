import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  online: '#10b981',    // Emerald
  offline: '#ef4444',   // Red
  active: '#3b82f6',    // Blue
  inactive: '#94a3b8',  // Slate
  assigned: '#8b5cf6',  // Purple
  unassigned: '#f59e0b' // Amber
};

const PieCharts = ({ gateways = [], devices = [] }) => {
  // 1. Gateway Status (Online vs Offline)
  const gwOnline = gateways.filter(g => g.status === 'online').length;
  const gwOffline = gateways.filter(g => g.status === 'offline').length;
  const gatewayData = [
    { name: 'Online', value: gwOnline, color: COLORS.online },
    { name: 'Offline', value: gwOffline, color: COLORS.offline }
  ].filter(d => d.value > 0);

  // 2. Device Status (Active vs Inactive)
  const devActive = devices.filter(d => d.status === 'active').length;
  const devInactive = devices.filter(d => d.status === 'inactive').length;
  const deviceStatusData = [
    { name: 'Active', value: devActive, color: COLORS.active },
    { name: 'Inactive', value: devInactive, color: COLORS.inactive }
  ].filter(d => d.value > 0);

  // 3. Device Assigned (Assigned vs Unassigned)
  const devAssigned = devices.filter(d => d.assignment === 'assigned').length;
  const devUnassigned = devices.filter(d => d.assignment === 'unassigned').length;
  const deviceAssignData = [
    { name: 'Assigned', value: devAssigned, color: COLORS.assigned },
    { name: 'Unassigned', value: devUnassigned, color: COLORS.unassigned }
  ].filter(d => d.value > 0);

  const renderChartCard = (title, data, totalCount) => {
    return (
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-md flex flex-col items-center justify-between w-full h-[320px] transition-all duration-300 hover:shadow-lg">
        <div className="w-full text-left">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalCount} Total</p>
        </div>

        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium">
            No data available
          </div>
        ) : (
          <div className="relative w-full h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value} items`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute flex flex-col items-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Ratio</span>
              <span className="text-lg font-black text-slate-700">
                {totalCount > 0 ? Math.round((data[0]?.value / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-2 w-full text-xs font-semibold text-slate-600">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span>{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {renderChartCard("Gateway Status", gatewayData, gateways.length)}
      {renderChartCard("Device Status", deviceStatusData, devices.length)}
      {renderChartCard("Device Assignment", deviceAssignData, devices.length)}
    </div>
  );
};

export default PieCharts;
