import { createContext, useContext, useEffect, useState } from 'react';

const CommunityRealtimeContext = createContext({
  realtimeReports: [],
  realtimeHotspots: [],
  realtimeStats: null,
  isConnected: false,
});

export const useCommunityRealtime = () => useContext(CommunityRealtimeContext);

export const CommunityRealtimeProvider = ({ children }) => {
  const [realtimeReports, setRealtimeReports] = useState([]);
  const [realtimeHotspots, setRealtimeHotspots] = useState([]);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to Server-Sent Events stream
    const eventSource = new EventSource('/api/community/stream');

    eventSource.onopen = () => {
      console.log('[SSE] Connected to Community Realtime Stream');
      setIsConnected(true);
    };

    eventSource.addEventListener('connected', (event) => {
      console.log('[SSE] Handshake:', JSON.parse(event.data));
    });

    eventSource.addEventListener('new-report', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] New Report Received:', data.report.item_name);

        // Deduplicate and append the new report
        if (data.report) {
          setRealtimeReports(prev => {
            if (prev.some(r => r.id === data.report.id)) return prev;
            // Add new report to the beginning of the list for chronological ordering
            return [data.report, ...prev];
          });
        }

        if (data.hotspots) {
          setRealtimeHotspots(data.hotspots);
        }

        if (data.stats) {
          setRealtimeStats(data.stats);
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event data:', err);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      setIsConnected(false);
      // EventSource automatically attempts to reconnect
    };

    return () => {
      console.log('[SSE] Disconnecting from Community Realtime Stream');
      eventSource.close();
    };
  }, []);

  return (
    <CommunityRealtimeContext.Provider value={{ realtimeReports, realtimeHotspots, realtimeStats, isConnected }}>
      {children}
    </CommunityRealtimeContext.Provider>
  );
};
