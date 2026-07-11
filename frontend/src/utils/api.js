import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// Attach token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('nc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    // Do not redirect on 401 if it's from the login endpoint itself
    const isLoginRequest = err.config?.url === '/auth/login';
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('nc_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
