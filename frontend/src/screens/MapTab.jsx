import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchReports } from '../api/client';
import BottomNav from '../components/BottomNav';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create custom icons based on risk level
const createIcon = (colorHex) => {
  return new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${colorHex}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const icons = {
  low: createIcon('#4E8362'),     // success
  caution: createIcon('#D9A441'), // caution
  high: createIcon('#C4705F')     // danger
};

export default function MapTab() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all'); // all, dairy, produce

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await fetchReports();
        setReports(data);
      } catch (err) {
        console.error("Failed to fetch map reports", err);
      }
    };
    loadReports();
  }, []);

  const filteredReports = reports.filter(r => filter === 'all' || r.category === filter);

  // India center
  const center = [22.5937, 78.9629];
  const defaultZoom = 4.5;

  return (
    <div className="flex flex-col h-screen bg-page-bg relative">
      
      {/* Floating Header/Filter */}
      <div className="absolute top-0 left-0 right-0 z-[400] p-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-1.5 flex shadow-lg border border-border-subtle">
            {['all', 'dairy', 'produce'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-1 capitalize py-2 px-3 text-sm font-bold rounded-xl transition-colors ${
                  filter === cat 
                    ? 'bg-primary text-white' 
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 z-0 relative pb-20">
        <MapContainer center={center} zoom={defaultZoom} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredReports.map(report => (
            report.lat && report.lng && (
              <Marker 
                key={report.id} 
                position={[report.lat, report.lng]} 
                icon={icons[report.risk_level] || icons.low}
              >
                <Popup className="custom-popup">
                  <div className="font-body">
                    <p className="font-bold font-heading text-primary text-base mb-1">{report.item_name}</p>
                    <p className="text-xs text-secondary mb-2">Reported by {report.user_name || 'Anonymous'} • {new Date(report.created_at).toLocaleDateString()}</p>
                    <p className="text-sm font-medium">{report.ai_reasoning}</p>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* Fix bottom nav overlay over map */}
      <div className="absolute bottom-0 w-full z-[1000]">
        <BottomNav />
      </div>
    </div>
  );
}
