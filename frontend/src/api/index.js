import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cook-for-3.onrender.com/api'
});

export default api;
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
export const login = (username, password) => api.post('/auth/login', { username, password });
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const getRecipes = () => api.get('/recipes');
export const getRecipe = (id) => api.get('/recipes/' + id);
export const createRecipe = (formData) => api.post('/recipes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateRecipe = (id, formData) => api.put('/recipes/' + id, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteRecipe = (id) => api.delete('/recipes/' + id);
export const createOrder = (data) => api.post('/orders', data);
export const getPendingOrderCount = () => api.get('/orders/pending-count');
export const getOrders = (role) => api.get('/orders?role=' + role);
export const updateOrderStatus = (id, status) => api.put('/orders/' + id + '/status', { status });
export const createRating = (data) => api.post('/ratings', data);
export const getRatingStats = () => api.get('/ratings/stats');
export const register = (data) =>
  api.post('/auth/register', data);
