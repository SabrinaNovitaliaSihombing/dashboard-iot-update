import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Router, Cpu } from 'lucide-react';

// Custom Map center update helper
const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Custom Premium HTML Icons using Tailwind CSS
const createGatewayIcon = (status) => {
  const color = status === 'online' ? 'bg-emerald-500' : 'bg-red-500';
  const pingColor = status === 'online' ? 'bg-emerald-500/30' : 'bg-red-500/30';
  return L.divIcon({
    className: 'custom-gw-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-8 h-8 ${pingColor} rounded-full animate-ping"></div>
        <div class="w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center border-2 border-white shadow-md text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
        </div>
        <div class="absolute -top-1.5 -right-1 w-2.5 h-2.5 ${color} rounded-full border border-white"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10]
  });
};

const createDeviceIcon = (status) => {
  const color = status === 'active' ? 'bg-blue-500' : 'bg-slate-400';
  const ringColor = status === 'active' ? 'border-blue-500' : 'border-slate-400';
  return L.divIcon({
    className: 'custom-node-marker',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="w-3.5 h-3.5 ${color} rounded-full border-2 border-white shadow-md"></div>
        <div class="absolute w-5 h-5 rounded-full border-2 ${ringColor} opacity-50 animate-pulse"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -8]
  });
};

const MapComponent = ({ gateways = [], devices = [] }) => {
  // Center map around Jakarta by default (or average coordinates of items)
  const defaultCenter = [-6.2088, 106.8456]; // Jakarta
  
  // Calculate average coordinates if data exists
  let center = defaultCenter;
  const coordinates = [
    ...gateways.map(g => [parseFloat(g.latitude), parseFloat(g.longitude)]),
    ...devices.map(d => [parseFloat(d.latitude), parseFloat(d.longitude)])
  ].filter(coords => !isNaN(coords[0]) && !isNaN(coords[1]));

  if (coordinates.length > 0) {
    const latSum = coordinates.reduce((sum, c) => sum + c[0], 0);
    const lngSum = coordinates.reduce((sum, c) => sum + c[1], 0);
    center = [latSum / coordinates.length, lngSum / coordinates.length];
  }

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Interactive Device Map</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time geographical view of your IoT network</p>
        </div>
      </div>

      <div className="w-full h-[450px]">
        <MapContainer 
          center={center} 
          zoom={11} 
          scrollWheelZoom={true} 
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeMapView center={center} />

          {/* Render Gateways */}
          {gateways.map((gw) => {
            const lat = parseFloat(gw.latitude);
            const lng = parseFloat(gw.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker 
                key={`gw-${gw.id}`} 
                position={[lat, lng]} 
                icon={createGatewayIcon(gw.status)}
              >
                <Popup className="custom-popup">
                  <div className="p-1 font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-1.5">
                      <Router className="w-4 h-4 text-blue-500" />
                      <span>{gw.gateway_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-1 font-semibold">
                      <p><span className="text-slate-400">Model:</span> {gw.unit_model}</p>
                      <p><span className="text-slate-400">Installed:</span> {gw.installation_date}</p>
                      <p className="flex items-center gap-1">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide text-white ${gw.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                          {gw.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Render Devices / Nodes */}
          {devices.map((dev) => {
            const lat = parseFloat(dev.latitude);
            const lng = parseFloat(dev.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker 
                key={`dev-${dev.id}`} 
                position={[lat, lng]} 
                icon={createDeviceIcon(dev.status)}
              >
                <Popup className="custom-popup">
                  <div className="p-1 font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-1.5">
                      <Cpu className="w-4 h-4 text-purple-500" />
                      <span>{dev.device_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-1 font-semibold">
                      <p><span className="text-slate-400">Merk:</span> {dev.merk}</p>
                      <p><span className="text-slate-400">Installed:</span> {dev.installation_date}</p>
                      <p><span className="text-slate-400">Owner ID:</span> {dev.id_user_owner ? `User #${dev.id_user_owner}` : 'Unassigned'}</p>
                      <p className="flex items-center gap-1">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide text-white ${dev.status === 'active' ? 'bg-blue-500' : 'bg-slate-400'}`}>
                          {dev.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      {/* Map Legend */}
      <div className="flex gap-6 mt-4 text-xs font-semibold text-slate-500 justify-center border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-slate-900 border border-white shadow rounded-full flex items-center justify-center text-[8px] text-blue-400 font-bold">G</span>
          <span>Gateway (Online)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-red-500 border border-white shadow rounded-full flex items-center justify-center text-[8px] text-white font-bold">G</span>
          <span>Gateway (Offline)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-blue-500 border border-white shadow rounded-full"></span>
          <span>Node (Active)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-slate-400 border border-white shadow rounded-full"></span>
          <span>Node (Inactive)</span>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
