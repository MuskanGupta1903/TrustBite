import { useState, useEffect, useMemo } from 'react';
import { Circle, Loader2, AlertTriangle, Activity, TrendingUp, Zap } from 'lucide-react';
import { fetchCommunityNearby } from '../api/client';

export default function FeedCard() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'risk'
  const [communityAlert, setCommunityAlert] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const data = await res.json();
          setFeed(data);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
    const intervalId = setInterval(fetchReports, 10000); 
    return () => clearInterval(intervalId);
  }, []);

  // Check for community alerts near user
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        if ('geolocation' in navigator) {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          const data = await fetchCommunityNearby(position.coords.latitude, position.coords.longitude);
          if (data.anomaly_detected || data.trend === 'UNUSUAL_SPIKE') {
            setCommunityAlert(data);
          }
        }
      } catch (err) {
        // Silently fail — alerts are best-effort
      }
    };
    checkAlerts();
  }, []);

  const riskAreas = useMemo(() => {
    const areas = {};
    feed.forEach(report => {
      if (report.risk_level === 'high' || report.risk_level === 'caution') {
        if (!areas[report.locality]) {
          areas[report.locality] = { count: 0, items: new Set(), highRisk: 0, reports24h: 0 };
        }
        areas[report.locality].count++;
        if (report.risk_level === 'high') areas[report.locality].highRisk++;
        areas[report.locality].items.add(report.item_name);
        // Check if recent
        const reportAge = Date.now() - new Date(report.created_at).getTime();
        if (reportAge < 24 * 60 * 60 * 1000) areas[report.locality].reports24h++;
      }
    });
    return Object.entries(areas)
      .map(([locality, data]) => ({ 
        locality, 
        count: data.count, 
        highRisk: data.highRisk,
        reports24h: data.reports24h,
        items: Array.from(data.items) 
      }))
      .sort((a, b) => b.count - a.count);
  }, [feed]);

  const getRiskStyles = (risk) => {
    if (risk === 'high') return { color: 'text-danger', dot: 'fill-danger text-danger' };
    if (risk === 'caution') return { color: 'text-caution', dot: 'fill-caution text-caution' };
    return { color: 'text-success', dot: 'fill-success text-success' };
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="bg-white/90 border border-border-subtle rounded-xl flex flex-col h-full overflow-hidden backdrop-blur-sm">
      
      {/* Community Alert Banner */}
      {communityAlert && (
        <div className="bg-danger/5 border-b border-danger/20 px-4 py-2.5 flex items-center gap-2">
          <Zap size={14} className="text-danger shrink-0" />
          <p className="text-xs font-bold text-primary truncate">
            Elevated food-safety activity detected nearby
          </p>
        </div>
      )}

      {/* Header Tabs */}
      <div className="flex border-b border-border-subtle">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'feed' ? 'text-primary border-b-2 border-primary bg-white' : 'text-secondary bg-gray-50/50 hover:bg-gray-50'}`}
        >
          <Activity size={16} />
          Live Feed
        </button>
        <button 
          onClick={() => setActiveTab('risk')}
          className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'risk' ? 'text-danger border-b-2 border-danger bg-white' : 'text-secondary bg-gray-50/50 hover:bg-gray-50'}`}
        >
          <AlertTriangle size={16} />
          Risk Areas
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-secondary" />
          </div>
        ) : activeTab === 'feed' ? (
          feed.length === 0 ? (
            <div className="flex justify-center items-center h-full text-secondary text-sm font-mono">
              No recent reports
            </div>
          ) : (
            <div className="flex flex-col">
              {feed.map((entry, index) => {
                const styles = getRiskStyles(entry.risk_level);
                return (
                  <div 
                    key={entry.id} 
                    className={`px-4 py-3.5 flex items-center justify-between ${index !== feed.length - 1 ? 'border-b border-dashed border-border-subtle' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-medium text-secondary shrink-0">{formatTime(entry.created_at)}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <Circle className={`w-2 h-2 shrink-0 ${styles.dot}`} />
                        <span className="font-mono text-sm text-primary font-semibold truncate">{entry.item_name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Risk Areas View */
          riskAreas.length === 0 ? (
            <div className="flex justify-center items-center h-full text-secondary text-sm font-mono">
              No risk areas identified
            </div>
          ) : (
            <div className="flex flex-col p-2 gap-2">
              {riskAreas.map((area, index) => (
                <div key={index} className="bg-danger/5 border border-danger/20 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-primary truncate pr-2">{area.locality}</span>
                    <span className="bg-danger/10 text-danger text-xs font-bold px-2 py-0.5 rounded border border-danger/20 shrink-0">
                      {area.count} Flags
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-tight mt-1 truncate">
                    <span className="font-semibold">Items: </span>
                    {area.items.join(', ')}
                  </p>
                  {area.reports24h > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <TrendingUp size={10} className="text-danger" />
                      <span className="text-[10px] font-bold text-danger">{area.reports24h} in last 24h</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
