import { useState, useEffect } from 'react';
import SlideToLogin from '../components/SlideToLogin';
import { Leaf } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [locationStr, setLocationStr] = useState('Koramangala, BLR');
  
  const [typedText, setTypedText] = useState('');
  const fullText = "One photo protects a neighborhood,\nnot just one buyer.";
  
  useEffect(() => {
    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength++;
      setTypedText(fullText.slice(0, currentLength));
      if (currentLength >= fullText.length) {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('tb_user_name', name);
      localStorage.setItem('tb_user_location', locationStr);
      onLoginSuccess();
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-primary flex flex-col items-center justify-center animate-fade-in-up">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0 bg-primary">
        <img src="/images/pic1.jpg" alt="Market 1" className="slideshow-image" />
        <img src="/images/pic2.webp" alt="Market 2" className="slideshow-image" />
        <img src="/images/pic3.jpg" alt="Market 3" className="slideshow-image" />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[rgba(20,40,26,0.95)] via-[rgba(20,40,26,0.5)] to-transparent pointer-events-none"></div>

      {/* Content anchored to center */}
      <div className="relative z-20 px-6 w-full flex flex-col items-center text-center">
        
        {/* Animated Form vs Main Card */}
        <div className="w-full max-w-sm relative flex flex-col items-center">
          
          {/* Main Card (Hides when form shows) */}
          <div className={`relative group bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] shadow-2xl mb-8 flex flex-col items-center w-full transition-all duration-500 ${showForm ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100'}`}>
            
            {/* Multiple Leaves around the title */}
            <div className="absolute top-4 left-6 opacity-0 transform scale-50 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-x-8 group-hover:-translate-y-8 group-hover:-rotate-45 z-0 text-success drop-shadow-md">
              <Leaf size={32} fill="currentColor" strokeWidth={1} />
            </div>
            <div className="absolute top-2 right-6 opacity-0 transform scale-50 transition-all duration-700 delay-75 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-8 group-hover:-translate-y-6 group-hover:rotate-45 z-0 text-success drop-shadow-md">
              <Leaf size={28} fill="currentColor" strokeWidth={1} />
            </div>
            <div className="absolute bottom-16 left-4 opacity-0 transform scale-50 transition-all duration-700 delay-100 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-x-6 group-hover:translate-y-6 group-hover:-rotate-90 z-0 text-success drop-shadow-md">
              <Leaf size={24} fill="currentColor" strokeWidth={1} />
            </div>
            <div className="absolute bottom-12 right-4 opacity-0 transform scale-50 transition-all duration-700 delay-150 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-10 group-hover:translate-y-4 group-hover:rotate-90 z-0 text-success drop-shadow-md">
              <Leaf size={36} fill="currentColor" strokeWidth={1} />
            </div>

            {/* Inner card content */}
            <div className="p-8 flex flex-col items-center relative z-10 w-full h-full bg-transparent">
              <h1 className="text-6xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 mb-4 tracking-tight drop-shadow-lg cursor-default">
                TrustBite
              </h1>
              <p className="text-white/95 text-lg font-serif italic leading-relaxed font-medium min-h-[3.5rem] whitespace-pre-line text-shadow-sm">
                {typedText}<span className="animate-pulse opacity-70">|</span>
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] shadow-2xl mb-8 p-6 w-full transition-all duration-500 ${!showForm ? 'opacity-0 scale-95 pointer-events-none absolute inset-0' : 'relative opacity-100 scale-100'}`}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">Who's checking?</h2>
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-success/50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Locality</label>
                <input 
                  type="text"
                  required 
                  value={locationStr}
                  onChange={(e) => setLocationStr(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-success/50"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-white text-primary font-bold py-3.5 rounded-xl mt-2 hover:bg-white/90 active:scale-[0.98] transition-transform"
              >
                Continue to App
              </button>
            </form>
          </div>
        </div>
        
        <div className={`w-full flex justify-center mt-2 transition-all duration-500 ${showForm ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <SlideToLogin onLogin={() => setShowForm(true)} />
        </div>
      </div>
    </div>
  );
}
