import axios from 'axios';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${API_ORIGIN.replace(/\/$/, '')}/api`,
});

export default api;
