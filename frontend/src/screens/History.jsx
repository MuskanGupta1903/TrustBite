import { useState, useEffect } from 'react';
import { Circle, FileText } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('tb_history') || '[]');
    setHistory(savedHistory);
  }, []);

  const getRiskStyles = (risk) => {
    if (risk === 'high') return { color: 'text-danger', dot: 'fill-danger text-danger', bg: 'bg-danger/10', border: 'border-danger/30' };
    if (risk === 'caution') return { color: 'text-caution', dot: 'fill-caution text-caution', bg: 'bg-caution/10', border: 'border-caution/30' };
    return { color: 'text-success', dot: 'fill-success text-success', bg: 'bg-success/10', border: 'border-success/30' };
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-page-bg font-body pb-32">
      <div className="max-w-5xl mx-auto p-6 flex flex-col relative z-10 h-full">
        <Header />
        
        <h2 className="text-2xl font-heading font-bold text-primary mb-6">My Scans</h2>

        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center mt-20 opacity-60">
            <FileText className="w-16 h-16 text-secondary mb-4" />
            <p className="text-secondary font-medium text-lg">No scans yet.</p>
            <p className="text-sm text-secondary">Your personal scan history will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((record) => {
              const styles = getRiskStyles(record.riskLevel);
              return (
                <div key={record.id} className="bg-white/90 backdrop-blur-sm border border-border-subtle rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm font-bold text-primary">{record.itemName}</span>
                    <span className="text-xs text-secondary font-medium">{formatDate(record.date)}</span>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${styles.bg} ${styles.border}`}>
                    <Circle className={`w-2 h-2 ${styles.dot}`} />
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${styles.color}`}>
                      {record.riskLevel === 'high' ? 'High Risk' : record.riskLevel === 'caution' ? 'Caution' : 'Low Risk'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
