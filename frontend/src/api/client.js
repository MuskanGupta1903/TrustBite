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
    throw new Error('Failed to analyze scan');
  }

  return response.json();
};

export const fetchReports = async (area = '') => {
  const url = area ? `${API_BASE}/reports?area=${encodeURIComponent(area)}` : `${API_BASE}/reports`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }

  return response.json();
};
