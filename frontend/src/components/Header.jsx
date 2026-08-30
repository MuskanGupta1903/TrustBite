import { useState, useEffect } from 'react';
import { MapPin, Leaf } from 'lucide-react';

export default function Header() {
  const [userLocation, setUserLocation] = useState('');

  useEffect(() => {
    // Read from localStorage on mount. The login screen enforces that this is set.
    setUserLocation(localStorage.getItem('tb_user_location') || 'Location detected');
  }, []);

  return (
    <header className="flex justify-between items-center pb-5 pt-2 mb-6">
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-white/50 px-4 py-2 rounded-full shadow-md">
        <div className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center shrink-0 bg-white">
          <img src="/images/logotrustbite.jpg" alt="TrustBite Logo" className="w-full h-full object-cover scale-[1.7] translate-y-0.5" />
        </div>
        <h1 className="text-2xl font-extrabold font-heading text-primary tracking-tight">
          TrustBite
        </h1>
      </div>
      <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-white/50 px-4 py-2.5 rounded-full shadow-md text-primary max-w-[150px]">
        <MapPin size={16} className="text-success shrink-0" />
        <span className="text-sm font-bold tracking-wide truncate">{userLocation}</span>
      </div>
    </header>
  );
}
