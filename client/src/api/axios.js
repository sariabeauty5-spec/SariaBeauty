import axios from 'axios';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const base = API_ORIGIN.replace(/\/$/, '');
const apiBaseURL = base.endsWith('/api') ? base : `${base}/api`;

const api = axios.create({
  baseURL: apiBaseURL,
});

export default api;
