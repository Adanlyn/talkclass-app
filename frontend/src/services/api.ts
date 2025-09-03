import axios from 'axios';

// baseURL vem do .env (VITE_API_URL=http://localhost:5252)
const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5252').replace(/\/$/, '');
console.log('[API] baseURL =', baseURL);

const api = axios.create({
  baseURL: `${baseURL}/api`,                                                              
  withCredentials: false, // não usamos cookies
});

// intercepta requests para anexar token do localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
