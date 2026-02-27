import axios from 'axios';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_ORIGIN,
});

export default api;
