import { useState, useEffect } from 'react';
import { fetchLocalStats } from '../api/client';

export default function StatCard() {
  const [stats, setStats] = useState({ scansToday: 0, totalScans: 0 });
  const locality = 'Current Location';

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchLocalStats(locality);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [locality]);

  return (
    <div className="bg-primary text-surface rounded-xl p-5 flex flex-col justify-center h-full">
      <div className="text-5xl font-mono font-bold tracking-tight mb-2">{stats.scansToday}</div>
      <div className="text-sm text-[#D3E2CE] leading-snug font-medium">
        scans in your<br />area today
      </div>
      {stats.totalScans > 0 && (
        <div className="text-xs text-[#D3E2CE]/60 font-mono mt-2">
          {stats.totalScans} total
        </div>
      )}
    </div>
  );
}
