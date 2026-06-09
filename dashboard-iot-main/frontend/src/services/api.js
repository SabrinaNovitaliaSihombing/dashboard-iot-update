import axios from 'axios';

const API_URL = 'http://localhost:5005/api';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to attach authentication token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

export const gatewayService = {
  getAll: async () => {
    const response = await api.get('/gateways');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/gateways', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/gateways/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/gateways/${id}`);
    return response.data;
  }
};

export const deviceService = {
  getAll: async () => {
    const response = await api.get('/devices');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/devices', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/devices/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  }
};

export const telemetryService = {
  getStats: async (filter = 'Today') => {
    const response = await api.get('/telemetry', { params: { filter } });
    return response.data;
  }
};

export default api;
