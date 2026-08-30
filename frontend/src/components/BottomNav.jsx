import { Apple, Milk, Carrot } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { id: 'home', label: 'Home', icon: Apple, path: '/home' },
    { id: 'map', label: 'Map', icon: Milk, path: '/map' },
    { id: 'history', label: 'History', icon: Carrot, path: '/history' },
  ];

  return (
    <>
      {/* Solid white background with subtle top shadow */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] pb-safe pt-3 px-6 pb-5 z-50 rounded-t-3xl border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex justify-center gap-32 items-center">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.id} 
                to={item.path}
                className={`flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-gray-400 hover:text-primary hover:scale-105'}`}
              >
                <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-[#E7F0E5] shadow-sm' : ''}`}>
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-primary/20' : ''} />
                </div>
                <span className={`text-[11px] font-medium tracking-wide transition-colors ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
