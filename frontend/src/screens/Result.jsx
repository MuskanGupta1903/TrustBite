import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Info, XCircle, Camera, MessageCircle, MapPin, TrendingUp, Zap, Copy, Check, ShieldAlert, ImageOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  if (!location.state || !location.state.resultData) {
    return <Navigate to="/home" replace />;
  }

  const { resultData, previewUrl, fullResponse } = location.state;

  // Determine which view to show based on validation/screening status
  const screeningStatus = resultData.screeningStatus || resultData.riskLevel;

  // AI Service Error
  if (screeningStatus === 'AI_SERVICE_UNAVAILABLE' || screeningStatus === 'AI_ANALYSIS_FAILED' || resultData.riskLevel === 'error') {
    return <InvalidInputScreen 
      navigate={navigate} 
      previewUrl={previewUrl}
      title="Analysis Unavailable"
      icon={<AlertTriangle className="w-12 h-12 text-caution" />}
      message="Visual analysis is temporarily unavailable."
      detail=""
      categories={[]}
      suggestion="Please try again in a moment."
      showRescan={true}
    />;
  }

  // Non-food / Invalid input states
  if (screeningStatus === 'NON_FOOD' || resultData.riskLevel === 'non_food') {
    return <InvalidInputScreen 
      navigate={navigate} 
      previewUrl={previewUrl}
      title="Image Not Supported"
      icon={<ImageOff className="w-12 h-12 text-secondary" />}
      message="We couldn't identify a supported food item in this image."
      detail="TrustBite currently screens:"
      categories={['🥛 Dairy (milk, curd, paneer)', '🥬 Fruits & vegetables']}
      suggestion="Please upload a clear photo of the food item you'd like to screen."
    />;
  }

  if (screeningStatus === 'UNSUPPORTED_FOOD' || resultData.riskLevel === 'unsupported') {
    return <InvalidInputScreen 
      navigate={navigate} 
      previewUrl={previewUrl}
      title="Category Not Supported"
      icon={<ShieldAlert className="w-12 h-12 text-caution" />}
      message={`This appears to be a food item, but it's not in a category TrustBite currently screens.`}
      detail="We currently support:"
      categories={['🥛 Dairy (milk, curd, paneer)', '🥬 Fruits & vegetables']}
      suggestion="Support for more categories is on our roadmap."
    />;
  }

  if (screeningStatus === 'CATEGORY_MISMATCH' || resultData.riskLevel === 'mismatch') {
    const mismatch = resultData.categoryMismatch || fullResponse?.validation?.category_mismatch;
    return <InvalidInputScreen 
      navigate={navigate} 
      previewUrl={previewUrl}
      title="Category Mismatch"
      icon={<RefreshCw className="w-12 h-12 text-caution" />}
      message={resultData.reasoning || `This appears to be ${mismatch?.detected?.toLowerCase()} rather than ${mismatch?.userSelected?.toLowerCase()}.`}
      detail="Would you like to scan again with the correct category?"
      categories={[]}
      suggestion=""
      showRescan={true}
    />;
  }

  if (screeningStatus === 'LOW_IMAGE_QUALITY' || resultData.riskLevel === 'low_quality') {
    const issues = resultData.imageQuality?.issues || fullResponse?.validation?.image_quality?.issues || [];
    return <InvalidInputScreen 
      navigate={navigate} 
      previewUrl={previewUrl}
      title="Image Quality Insufficient"
      icon={<Camera className="w-12 h-12 text-caution" />}
      message="We can't reliably screen this image because the food item isn't clearly visible."
      detail="Tips for a better scan:"
      categories={['📸 Move closer to the food item', '💡 Ensure good lighting', '🔍 Avoid blur — hold steady', '🎯 Make sure the food fills most of the frame']}
      suggestion={issues.length > 0 ? `Issues detected: ${issues.join(', ')}` : ''}
      showRescan={true}
    />;
  }

  if (resultData.riskLevel === 'duplicate') {
    return <InvalidInputScreen 
      navigate={navigate} 
      previewUrl={previewUrl}
      title="Duplicate Report"
      icon={<Copy className="w-12 h-12 text-secondary" />}
      message="This image has already been submitted."
      detail="Duplicate reports are not counted separately to maintain community signal quality."
      categories={[]}
      suggestion="Please upload a different image."
      showRescan={true}
    />;
  }

  // ─── VALID FOOD SCREENING RESULT ───
  const risk = fullResponse?.risk;
  const community = fullResponse?.community;
  const screening = fullResponse?.screening;
  const validation = fullResponse?.validation;
  const limitations = fullResponse?.limitations || resultData.limitations || [];

  // Signal level config
  const getSignalConfig = (level) => {
    switch(level) {
      case 'high':
        return { label: 'High Signal', color: 'text-danger', bg: 'bg-danger', lightBg: 'bg-danger/10', borderColor: 'border-danger/30', Icon: AlertTriangle };
      case 'elevated':
        return { label: 'Elevated Signal', color: 'text-danger', bg: 'bg-danger', lightBg: 'bg-danger/10', borderColor: 'border-danger/30', Icon: AlertTriangle };
      case 'moderate':
        return { label: 'Moderate Signal', color: 'text-caution', bg: 'bg-caution', lightBg: 'bg-caution/10', borderColor: 'border-caution/30', Icon: AlertTriangle };
      default:
        return { label: 'Low Signal', color: 'text-success', bg: 'bg-success', lightBg: 'bg-success/10', borderColor: 'border-success/30', Icon: CheckCircle };
    }
  };

  const signalLevel = risk?.signal_level || resultData.riskLevel;
  const config = getSignalConfig(signalLevel);
  const Icon = config.Icon;

  // Build shareable report text
  const shareText = buildShareText(resultData, risk, community);

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-page-bg font-body flex flex-col pb-safe">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border-subtle bg-white sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 rounded-full hover:bg-page-bg text-secondary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading font-bold text-lg text-primary">Screening Result</h1>
        <button onClick={handleCopy} className="p-2 rounded-full hover:bg-page-bg text-secondary" title="Copy report">
          {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col max-w-lg mx-auto w-full gap-4">
        
        {/* TrustBite Signal Badge */}
        <div className={`p-6 rounded-3xl border ${config.borderColor} ${config.lightBg} flex flex-col items-center justify-center text-center animate-fade-in-up`}>
          <Icon className={`w-10 h-10 ${config.color} mb-2`} />
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">TrustBite Signal</p>
          <h2 className={`text-2xl font-heading font-extrabold ${config.color} mb-1`}>
            {config.label}
          </h2>
          <p className="font-mono text-sm font-bold text-primary opacity-80 uppercase tracking-widest">
            {resultData.itemName}
          </p>
        </div>

        {/* Visual Signal */}
        {screening && (
          <div className="bg-white p-5 rounded-3xl border border-border-subtle shadow-sm animate-fade-in-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Visual Analysis
            </h3>
            <p className="text-primary font-medium leading-relaxed mb-3">
              {resultData.reasoning}
            </p>
            {screening.visual_observations && screening.visual_observations.length > 0 && (
              <div className="space-y-1.5">
                {screening.visual_observations.map((obs, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-secondary">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Observations */}
        {screening?.sensory_signals && Object.keys(screening.sensory_signals).length > 0 && (
          <div className="bg-white p-5 rounded-3xl border border-border-subtle shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Your Observations
            </h3>
            <div className="space-y-2">
              {Object.entries(screening.sensory_signals).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className={value === 'yes' ? 'text-danger' : 'text-success'}>
                    {value === 'yes' ? '⚠️' : '✓'}
                  </span>
                  <span className="text-primary font-medium capitalize">
                    {formatSensoryLabel(key)}: {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Signal */}
        {community && (community.nearby_reports_7d > 0 || community.nearby_reports_24h > 0) && (
          <div className="bg-white p-5 rounded-3xl border border-border-subtle shadow-sm animate-fade-in-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Community Reports
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-page-bg rounded-xl p-3 text-center">
                <p className="font-mono text-2xl font-bold text-primary">{community.nearby_reports_24h}</p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Last 24h</p>
              </div>
              <div className="bg-page-bg rounded-xl p-3 text-center">
                <p className="font-mono text-2xl font-bold text-primary">{community.nearby_reports_7d}</p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Last 7 days</p>
              </div>
            </div>
            <p className="text-sm text-secondary">
              Within {community.radius_km} km radius
              {community.similar_category_reports > 0 && ` • ${community.similar_category_reports} in same category`}
            </p>

            {/* Trend indicator */}
            {community.trend && community.trend !== 'STABLE' && (
              <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${
                community.trend === 'UNUSUAL_SPIKE' ? 'text-danger' : 
                community.trend === 'INCREASING' ? 'text-caution' : 'text-success'
              }`}>
                <TrendingUp className="w-4 h-4" />
                <span>{community.trend_description}</span>
              </div>
            )}

            {/* Anomaly alert */}
            {community.anomaly_detected && (
              <div className="mt-3 bg-danger/5 border border-danger/20 rounded-xl p-3 flex items-start gap-2">
                <Zap className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-primary font-medium">{community.anomaly_description}</p>
              </div>
            )}
          </div>
        )}

        {/* Why — Explainability */}
        {risk && risk.contributing_factors && risk.contributing_factors.length > 0 && (
          <div className="bg-white p-5 rounded-3xl border border-border-subtle shadow-sm animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> Why this signal?
            </h3>
            <div className="space-y-2.5">
              {risk.contributing_factors.filter(f => f.weight > 0).map((factor, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="text-lg leading-none shrink-0 mt-0.5">{factor.icon}</span>
                  <div>
                    <p className="font-bold text-primary">{factor.label}</p>
                    <p className="text-secondary">{factor.signal}</p>
                  </div>
                </div>
              ))}
            </div>
            {risk.explanation && (
              <p className="text-sm text-primary font-medium mt-3 pt-3 border-t border-border-subtle">
                {risk.explanation}
              </p>
            )}
          </div>
        )}

        {/* Uploaded Image Preview */}
        {previewUrl && !imageError && (
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-sm border border-border-subtle animate-fade-in-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
            <img src={previewUrl} alt="Analyzed item" className="w-full h-full object-cover opacity-90" onError={() => setImageError(true)} />
          </div>
        )}
        {previewUrl && imageError && (
          <div className="w-full aspect-video bg-black/5 rounded-3xl overflow-hidden shadow-sm border border-border-subtle flex flex-col items-center justify-center animate-fade-in-up text-secondary" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
            <ImageOff className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-medium opacity-60">Image unavailable after refresh</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-[#f4f6f5] p-5 border-l-4 border-l-secondary border border-border-subtle mt-2 animate-fade-in-up font-mono shadow-sm relative overflow-hidden" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <div className="absolute -right-4 -bottom-6 opacity-[0.03] rotate-[-10deg] pointer-events-none select-none">
            <span className="text-6xl font-black uppercase tracking-widest text-primary">SCREENING</span>
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
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md hover:bg-primary/90 mt-2 animate-fade-in-up"
          style={{ animationDelay: '0.35s', animationFillMode: 'both' }}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

/**
 * Invalid Input Screen — used for NON_FOOD, UNSUPPORTED, MISMATCH, LOW_QUALITY
 * Uses existing TrustBite card styling
 */
function InvalidInputScreen({ navigate, previewUrl, title, icon, message, detail, categories, suggestion, showRescan }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="min-h-screen bg-page-bg font-body flex flex-col pb-safe">
      <div className="p-4 flex items-center justify-between border-b border-border-subtle bg-white sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 rounded-full hover:bg-page-bg text-secondary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading font-bold text-lg text-primary">Scan Result</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-6 flex flex-col max-w-lg mx-auto w-full gap-6">
        {/* Status Card */}
        <div className="p-8 rounded-3xl border border-border-subtle bg-white shadow-sm flex flex-col items-center justify-center text-center animate-fade-in-up">
          <div className="mb-4">{icon}</div>
          <h2 className="text-2xl font-heading font-extrabold text-primary mb-3">{title}</h2>
          <p className="text-secondary font-medium leading-relaxed mb-4">{message}</p>
          
          {detail && <p className="text-sm font-bold text-primary mb-3">{detail}</p>}
          
          {categories && categories.length > 0 && (
            <div className="space-y-2 text-left w-full">
              {categories.map((cat, i) => (
                <div key={i} className="bg-page-bg rounded-xl px-4 py-2.5 text-sm font-medium text-primary">
                  {cat}
                </div>
              ))}
            </div>
          )}

          {suggestion && (
            <p className="text-sm text-secondary mt-4">{suggestion}</p>
          )}
        </div>

        {/* Image Preview */}
        {previewUrl && !imageError && (
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-sm border border-border-subtle animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <img src={previewUrl} alt="Uploaded image" className="w-full h-full object-cover opacity-70" onError={() => setImageError(true)} />
          </div>
        )}
        {previewUrl && imageError && (
          <div className="w-full aspect-video bg-black/5 rounded-3xl overflow-hidden shadow-sm border border-border-subtle flex flex-col items-center justify-center animate-fade-in-up text-secondary" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <ImageOff className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-medium opacity-60">Image unavailable after refresh</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          {showRescan && (
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md hover:bg-primary/90"
            >
              Scan Again
            </button>
          )}
          <button
            onClick={() => navigate('/home')}
            className={`w-full font-bold py-4 rounded-xl shadow-md hover:bg-primary/90 ${
              showRescan 
                ? 'bg-white text-primary border border-border-subtle hover:bg-page-bg' 
                : 'bg-primary text-white'
            }`}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSensoryLabel(key) {
  const labels = {
    smell: 'Unusual smell',
    lumpy: 'Curdling or lumpy',
    mold: 'Visible mold/spotting',
    texture: 'Unusual texture',
  };
  return labels[key] || key;
}

function buildShareText(resultData, risk, community) {
  let text = `TRUSTBITE SCREENING\n`;
  text += `Item: ${resultData.itemName}\n`;
  text += `Signal: ${risk?.signal_level || resultData.riskLevel}\n`;
  if (resultData.reasoning) text += `Visual: ${resultData.reasoning}\n`;
  if (community?.nearby_reports_7d > 0) {
    text += `Community: ${community.nearby_reports_7d} reports within ${community.radius_km}km / 7 days\n`;
  }
  text += `\n⚠️ Screening aid — not laboratory confirmation.`;
  return text;
}
