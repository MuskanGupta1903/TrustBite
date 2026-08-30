import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Info } from 'lucide-react';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom markers for our mock reports
const dangerIcon = new L.DivIcon({
  html: `<div class="w-4 h-4 bg-danger rounded-full border-2 border-white shadow-md"></div>`,
  className: 'custom-leaflet-icon',
});

const cautionIcon = new L.DivIcon({
  html: `<div class="w-4 h-4 bg-caution rounded-full border-2 border-white shadow-md"></div>`,
  className: 'custom-leaflet-icon',
});

export default function MapPreview() {
  // New Delhi Coordinates (mocking the user's locality)
  const position = [28.6139, 77.2090];
  
  return (
    <div className="w-full px-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider font-body">Community Reports</h3>
        <span className="flex items-center text-xs text-primary font-medium gap-1 bg-white px-2 py-1 rounded-md border border-border-subtle shadow-sm">
          <Info size={12} /> Last 7 Days
        </span>
      </div>
      
      <div className="w-full h-48 rounded-2xl overflow-hidden border border-border-subtle shadow-sm relative z-0">
        <MapContainer center={position} zoom={14} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {/* User's locality circle */}
          <Circle 
            center={position} 
            radius={800} 
            pathOptions={{ fillColor: '#4E8362', fillOpacity: 0.1, color: '#4E8362', weight: 1 }} 
          />

          {/* Mock hotspot 1 */}
          <Marker position={[28.6189, 77.2040]} icon={dangerIcon}>
            <Popup>
              <div className="font-body text-xs">
                <p className="font-bold text-danger mb-1">High Risk Report</p>
                <p>Curdled milk sold nearby.</p>
              </div>
            </Popup>
          </Marker>

          {/* Mock hotspot 2 */}
          <Marker position={[28.6109, 77.2150]} icon={cautionIcon}>
            <Popup>
              <div className="font-body text-xs">
                <p className="font-bold text-caution mb-1">Caution Report</p>
                <p>Waxy apples reported.</p>
              </div>
            </Popup>
          </Marker>

        </MapContainer>
        
        {/* Faded overlay at bottom so it feels integrated */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-page-bg/80 to-transparent pointer-events-none z-[1000]"></div>
      </div>
    </div>
  );
}
