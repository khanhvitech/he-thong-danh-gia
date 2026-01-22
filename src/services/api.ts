import axios from 'axios';

// Tự động detect API URL dựa vào môi trường
const getApiBaseUrl = () => {
  // Production: sử dụng cùng domain với frontend
  if (window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  // Development: sử dụng localhost
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Templates API
export const templatesAPI = {
  getAll: () => api.get('/templates'),
  getById: (id: string) => api.get(`/templates/${id}`),
  getBySlug: (slug: string) => api.get(`/templates/slug/${slug}`),
  create: (template: any) => api.post('/templates', template),
  update: (id: string, template: any) => api.put(`/templates/${id}`, template),
  delete: (id: string) => api.delete(`/templates/${id}`),
};

// Sessions API
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  getById: (id: string) => api.get(`/sessions/${id}`),
  getByToken: (token: string) => api.get(`/sessions/token/${token}`),
  create: (session: any) => api.post('/sessions', session),
  update: (id: string, session: any) => api.put(`/sessions/${id}`, session),
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

// Evaluations API
export const evaluationsAPI = {
  getAll: () => api.get('/evaluations'),
  getBySession: (sessionId: string) => api.get(`/evaluations/session/${sessionId}`),
  getByTemplate: (templateId: string) => api.get(`/evaluations/template/${templateId}`),
  getStatistics: (templateId: string) => api.get(`/evaluations/template/${templateId}/statistics`),
  submit: (evaluation: any) => api.post('/evaluations', evaluation),
  delete: (id: string) => api.delete(`/evaluations/${id}`),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
