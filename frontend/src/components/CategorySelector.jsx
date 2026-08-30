import { Droplet, Leaf } from 'lucide-react';

export default function CategorySelector({ selected, onSelect }) {
  return (
    <div className="flex flex-col h-full gap-3 justify-end">
      <div className="text-xs font-bold text-secondary uppercase tracking-wider px-1">Select Category</div>
      <div className="flex gap-4 flex-1 min-h-[140px]">
        <button
          onClick={() => onSelect('dairy')}
          className={`relative flex-1 rounded-[1.5rem] overflow-hidden transition-all duration-500 transform group shadow-md hover:shadow-2xl hover:-translate-y-1 ${
            selected === 'dairy' ? 'ring-4 ring-primary/60 scale-[1.02]' : 'hover:scale-[1.02] grayscale-[30%] hover:grayscale-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"></div>
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            selected === 'dairy' 
              ? 'bg-gradient-to-t from-[#1F3D2A]/90 via-[#1F3D2A]/50 to-transparent' 
              : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-[#1F3D2A]/80'
          }`}></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 backdrop-blur-md transition-colors ${
              selected === 'dairy' ? 'bg-white/30 text-white' : 'bg-black/30 text-white/80 group-hover:text-white'
            }`}>
              <Droplet className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-extrabold text-xl text-white tracking-tight">Dairy</span>
          </div>
        </button>
        
        <button
          onClick={() => onSelect('produce')}
          className={`relative flex-1 rounded-[1.5rem] overflow-hidden transition-all duration-500 transform group shadow-md hover:shadow-2xl hover:-translate-y-1 ${
            selected === 'produce' ? 'ring-4 ring-primary/60 scale-[1.02]' : 'hover:scale-[1.02] grayscale-[30%] hover:grayscale-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1610397962076-02407a169a5b?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"></div>
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            selected === 'produce' 
              ? 'bg-gradient-to-t from-[#1F3D2A]/90 via-[#1F3D2A]/50 to-transparent' 
              : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-[#1F3D2A]/80'
          }`}></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 backdrop-blur-md transition-colors ${
              selected === 'produce' ? 'bg-white/30 text-white' : 'bg-black/30 text-white/80 group-hover:text-white'
            }`}>
              <Leaf className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-extrabold text-xl text-white tracking-tight">Produce</span>
          </div>
        </button>
      </div>
    </div>
  );
}

