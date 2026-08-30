import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle as LeafletCircle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchReports, fetchHotspots } from '../api/client';
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

// Hotspot level colors
const hotspotColors = {
  LOW_ACTIVITY: { fill: '#4E8362', stroke: '#4E8362' },
  EMERGING: { fill: '#D9A441', stroke: '#D9A441' },
  ELEVATED: { fill: '#C4705F', stroke: '#C4705F' },
  HIGH_ACTIVITY: { fill: '#C4705F', stroke: '#8B0000' },
};

export default function MapTab() {
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [filter, setFilter] = useState('all'); // all, dairy, produce
  const [timeWindow, setTimeWindow] = useState('7d');
  const [showHotspots, setShowHotspots] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportsData, hotspotsData] = await Promise.all([
          fetchReports('', { window: timeWindow, category: filter !== 'all' ? filter : undefined }),
          fetchHotspots(),
        ]);
        setReports(reportsData);
        setHotspots(hotspotsData);
      } catch (err) {
        console.error("Failed to fetch map data", err);
      }
    };
    loadData();
  }, [filter, timeWindow]);

  const filteredReports = reports.filter(r => filter === 'all' || r.category === filter);

  // India center
  const center = [22.5937, 78.9629];
  const defaultZoom = 4.5;

  return (
    <div className="flex flex-col h-screen bg-page-bg relative">
      
      {/* Floating Header/Filter */}
      <div className="absolute top-0 left-0 right-0 z-[400] p-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto space-y-2">
          {/* Category Filter */}
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

          {/* Time Window + Hotspot Toggle */}
          <div className="flex gap-2">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-1 flex shadow-md border border-border-subtle flex-1">
              {['24h', '7d', '30d'].map(tw => (
                <button
                  key={tw}
                  onClick={() => setTimeWindow(tw)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    timeWindow === tw 
                      ? 'bg-primary text-white' 
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {tw}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-md border transition-colors ${
                showHotspots 
                  ? 'bg-danger/10 text-danger border-danger/30' 
                  : 'bg-white/90 text-secondary border-border-subtle'
              }`}
            >
              🔥 Hotspots
            </button>
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

          {/* Hotspot circles */}
          {showHotspots && hotspots.map((hotspot, i) => {
            const colors = hotspotColors[hotspot.level] || hotspotColors.LOW_ACTIVITY;
            const radius = Math.max(2000, Math.min(hotspot.report_count * 500, 10000));
            return (
              <LeafletCircle
                key={`hotspot-${i}`}
                center={[hotspot.center.lat, hotspot.center.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: colors.fill,
                  fillOpacity: 0.15,
                  color: colors.stroke,
                  weight: 2,
                  opacity: 0.6,
                }}
              >
                <Popup className="custom-popup">
                  <div className="font-body">
                    <p className="font-bold font-heading text-primary text-sm mb-1">
                      {hotspot.locality} — {hotspot.level.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-secondary mb-1">
                      {hotspot.report_count} reports ({hotspot.reports_24h} in last 24h)
                    </p>
                    <p className="text-xs text-secondary">
                      Category: {hotspot.category}
                    </p>
                  </div>
                </Popup>
              </LeafletCircle>
            );
          })}

          {/* Individual report markers */}
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
                    {report.screening_status && (
                      <p className="text-[10px] font-mono text-secondary mt-1 uppercase">{report.screening_status}</p>
                    )}
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
