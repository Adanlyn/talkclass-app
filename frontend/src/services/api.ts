import axios from 'axios';
import { getToken, isLoggedIn, logoutAndReload } from '../utils/auth';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5252').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && isLoggedIn()) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      logoutAndReload('/login'); // se token inválido, força logout
    }
    return Promise.reject(err);
  }
);

export default api;
