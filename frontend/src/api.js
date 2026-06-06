import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ta_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const msg = error.response?.data?.message || '';

      if (msg.includes('suspended') || msg.includes('rejected')) {
      if (localStorage.getItem('ta_token')) {
         localStorage.removeItem('ta_user');
         localStorage.removeItem('ta_token');
         window.location.href = '/login';
    }
  }
}
    return Promise.reject(error);
  }
);

export default API;
