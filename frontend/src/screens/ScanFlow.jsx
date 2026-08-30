import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Questionnaire from '../components/Questionnaire';
import { uploadScan } from '../api/client';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const loadingTexts = [
  "Analyzing visual texture...",
  "Processing sensory inputs...",
  "Cross-referencing locality...",
  "Finalizing risk assessment..."
];

export default function ScanFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || new URLSearchParams(location.search).get('category') || 'produce';
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [userName, setUserName] = useState(localStorage.getItem('tb_user_name') || '');
  const [userCity, setUserCity] = useState(localStorage.getItem('tb_user_location') || 'Koramangala, BLR');
  const [itemName, setItemName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file]);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setLoadingTextIndex(prev => (prev + 1) % loadingTexts.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setLoadingTextIndex(0);

    // Get current location, fallback to India center if unavailable
    let currentLat = 22.5937;
    let currentLng = 78.9629;
    
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
      }
    } catch (err) {
      console.warn("Geolocation failed, using default coords:", err);
    }

    try {
      const data = {
        category,
        locality: userCity || 'Unknown Location',
        lat: currentLat,
        lng: currentLng,
        userName,
        itemName,
        ...answers
      };
      
      const result = await uploadScan(file, data);
      
      // Save to personal history in localStorage
      const historyRecord = {
        id: Date.now(),
        date: new Date().toISOString(),
        category,
        itemName: result.result.itemName,
        riskLevel: result.result.riskLevel
      };
      
      const existingHistory = JSON.parse(localStorage.getItem('tb_history') || '[]');
      localStorage.setItem('tb_history', JSON.stringify([historyRecord, ...existingHistory]));

      // Navigate to results page with data
      navigate('/result', { state: { resultData: result.result, previewUrl: preview } });
      
    } catch (error) {
      console.error("Scan failed:", error);
      alert("Analysis failed. Please try again.");
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
        <div className="relative mb-4 w-64 h-64 flex items-center justify-center">
          <DotLottieReact
            src="/Loading screen.lottie"
            loop
            autoplay
          />
        </div>
        <h2 className="text-2xl font-heading font-bold text-white mb-3">AI Analyzing</h2>
        <p className="text-success font-mono font-medium text-sm animate-pulse">
          {loadingTexts[loadingTextIndex]}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border-subtle bg-white">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-page-bg text-secondary">
          <X className="w-6 h-6" />
        </button>
        <h1 className="font-heading font-bold text-lg text-primary capitalize">Scan {category}</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col max-w-lg mx-auto w-full">
        
        {/* Photo Section */}
        {!preview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square bg-primary rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg mb-8 relative overflow-hidden"
          >
            {/* Viewfinder brackets */}
            <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-white/40 rounded-tl-xl"></div>
            <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-white/40 rounded-tr-xl"></div>
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-white/40 rounded-bl-xl"></div>
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-white/40 rounded-br-xl"></div>

            <Camera className="w-16 h-16 text-white mb-4 drop-shadow-md" />
            <p className="text-white font-heading font-bold text-lg">Tap to scan item</p>
            <p className="text-white/60 text-sm mt-1">or select from gallery</p>
          </div>
        ) : (
          <div className="w-full aspect-square bg-black rounded-3xl overflow-hidden relative mb-8 shadow-md">
            <img src={preview} alt="Scan preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileChange}
        />

        {/* Questionnaire Section */}
        {preview && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-border-subtle flex-1 flex flex-col">
            
            <h3 className="font-heading font-bold text-lg text-primary mb-4 border-b border-border-subtle pb-3">
              Scan Details
            </h3>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-primary mb-1">Your Name</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full bg-white border border-border-subtle rounded-xl px-4 py-2 text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-primary mb-1">City / Locality</label>
                <input 
                  type="text" 
                  value={userCity}
                  onChange={e => setUserCity(e.target.value)}
                  placeholder="e.g. Koramangala, BLR"
                  className="w-full bg-white border border-border-subtle rounded-xl px-4 py-2 text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-primary mb-1">What item is this?</label>
                <input 
                  type="text" 
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder={category === 'dairy' ? "e.g. Loose Milk, Paneer" : "e.g. Tomato, Apple"}
                  className="w-full bg-white border border-border-subtle rounded-xl px-4 py-2 text-primary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <h3 className="font-heading font-bold text-lg text-primary mb-4 border-b border-border-subtle pb-3">
              Sensory Check
            </h3>
            <div className="flex-1">
              <Questionnaire category={category} answers={answers} setAnswers={setAnswers} />
            </div>
            
            <button
              onClick={handleSubmit}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-8 shadow-md hover:bg-primary/90 transition-transform active:scale-[0.98]"
            >
              Analyze Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
