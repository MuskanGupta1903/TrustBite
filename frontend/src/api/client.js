const API_BASE = '/api';

export const uploadScan = async (file, data) => {
  const formData = new FormData();
  formData.append('photo', file);
  
  // Append all questionnaire data
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });

  const response = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze scan');
  }

  return response.json();
};

export const fetchReports = async (area = '', options = {}) => {
  const params = new URLSearchParams();
  if (area) params.set('area', area);
  if (options.window) params.set('window', options.window);
  if (options.category) params.set('category', options.category);
  
  const url = `${API_BASE}/reports?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }

  return response.json();
};

export const fetchCommunityNearby = async (lat, lng, radius = 3, category = null) => {
  const params = new URLSearchParams({ lat, lng, radius });
  if (category) params.set('category', category);
  
  const response = await fetch(`${API_BASE}/community/nearby?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch community data');
  return response.json();
};

export const fetchHotspots = async () => {
  const response = await fetch(`${API_BASE}/community/hotspots`);
  if (!response.ok) throw new Error('Failed to fetch hotspots');
  return response.json();
};

export const fetchLocalStats = async (locality = '') => {
  const params = new URLSearchParams();
  if (locality) params.set('locality', locality);
  
  const response = await fetch(`${API_BASE}/community/stats?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

export const seedReports = async () => {
  const response = await fetch(`${API_BASE}/reports/seed`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to seed reports');
  return response.json();
};

export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en'
      }
    });
    if (!response.ok) throw new Error('Reverse geocoding failed');
    const data = await response.json();
    if (data && data.address) {
      return data.address.city || data.address.town || data.address.municipality || data.address.suburb || data.address.village || 'Location detected';
    }
    return 'Location detected';
  } catch (error) {
    console.warn('Reverse geocoding warning:', error);
    return 'Location detected';
  }
};
