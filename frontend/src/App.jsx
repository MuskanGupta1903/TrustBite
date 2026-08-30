import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/Login';
import Home from './screens/Home';
import ScanFlow from './screens/ScanFlow';
import Result from './screens/Result';
import MapTab from './screens/MapTab';
import History from './screens/History';
import { CommunityRealtimeProvider } from './contexts/CommunityRealtimeContext';

function App() {
  return (
    <CommunityRealtimeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login onLoginSuccess={() => window.location.href='/home'} />} />
          <Route path="/home" element={<Home />} />
          <Route path="/scan" element={<ScanFlow />} />
          <Route path="/result" element={<Result />} />
          <Route path="/map" element={<MapTab />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Router>
    </CommunityRealtimeProvider>
  );
}

export default App;
