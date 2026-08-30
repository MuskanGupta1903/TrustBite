import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  
  if (!location.state || !location.state.resultData) {
    return <Navigate to="/home" replace />;
  }

  const { resultData, previewUrl } = location.state;

  const getRiskConfig = (risk) => {
    switch(risk) {
      case 'high':
        return { 
          label: 'High Risk', 
          color: 'text-danger', 
          bg: 'bg-danger', 
          lightBg: 'bg-danger/10',
          borderColor: 'border-danger/30',
          Icon: AlertTriangle 
        };
      case 'caution':
        return { 
          label: 'Caution', 
          color: 'text-caution', 
          bg: 'bg-caution', 
          lightBg: 'bg-caution/10',
          borderColor: 'border-caution/30',
          Icon: AlertTriangle 
        };
      default:
        return { 
          label: 'Low Risk', 
          color: 'text-success', 
          bg: 'bg-success', 
          lightBg: 'bg-success/10',
          borderColor: 'border-success/30',
          Icon: CheckCircle 
        };
    }
  };

  const config = getRiskConfig(resultData.riskLevel);
  const Icon = config.Icon;

  return (
    <div className="min-h-screen bg-page-bg font-body flex flex-col pb-safe">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border-subtle bg-white sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 rounded-full hover:bg-page-bg text-secondary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading font-bold text-lg text-primary">Scan Result</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-6 flex flex-col max-w-lg mx-auto w-full gap-6">
        
        {/* Risk Level Badge */}
        <div className={`p-6 rounded-3xl border ${config.borderColor} ${config.lightBg} flex flex-col items-center justify-center text-center animate-fade-in-up`}>
          <Icon className={`w-12 h-12 ${config.color} mb-3`} />
          <h2 className={`text-3xl font-heading font-extrabold ${config.color} mb-1`}>
            {config.label}
          </h2>
          <p className="font-mono text-sm font-bold text-primary opacity-80 uppercase tracking-widest">
            {resultData.itemName}
          </p>
        </div>

        {/* AI Reasoning */}
        <div className="bg-white p-6 rounded-3xl border border-border-subtle shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" /> AI Analysis
          </h3>
          <p className="text-primary font-medium leading-relaxed text-lg">
            {resultData.reasoning}
          </p>
        </div>

        {/* Uploaded Image Preview */}
        {previewUrl && (
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-sm border border-border-subtle animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <img src={previewUrl} alt="Analyzed item" className="w-full h-full object-cover opacity-90" />
          </div>
        )}

        {/* Disclaimer - Lab Style */}
        <div className="bg-[#f4f6f5] p-5 border-l-4 border-l-secondary border border-border-subtle mt-2 animate-fade-in-up font-mono shadow-sm relative overflow-hidden" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          
          {/* Watermark/Stamp effect */}
          <div className="absolute -right-4 -bottom-6 opacity-[0.03] rotate-[-10deg] pointer-events-none select-none">
            <span className="text-6xl font-black uppercase tracking-widest text-primary">GUIDELINE</span>
          </div>

          <div className="flex justify-between items-end border-b border-border-subtle pb-2 mb-3">
            <span className="font-bold text-primary uppercase tracking-widest text-xs">Methodology Limitation</span>
            <span className="text-[10px] text-secondary">REF-9X</span>
          </div>

          <div className="text-sm text-primary leading-relaxed text-justify space-y-2 relative z-10">
            <p className="font-bold uppercase tracking-wide">
              Screening aid — not a lab-grade test.
            </p>
            <p className="opacity-90 leading-loose">
              A photo can't smell milk. But a photo, your sensory context, and what's happening nearby, combined, can tell a very different story.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate('/home')}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md hover:bg-primary/90 mt-4 animate-fade-in-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
        >
          Return to Home
        </button>

      </div>
    </div>
  );
}
