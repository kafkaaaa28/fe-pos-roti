import axios, { AxiosHeaders } from 'axios';
import { API_URL } from '../utils/constants';

const TOKEN_KEY = 'pos-roti-token';

type BackendEnvelope<T> = {
  success?: boolean;
  data?: T;
  timestamp?: string;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? (localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem('token')) : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const payload = response.data as BackendEnvelope<unknown> | unknown;

    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      'data' in payload
    ) {
      response.data = (payload as BackendEnvelope<unknown>).data;
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('pos-roti-user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  },
);

export default api;
