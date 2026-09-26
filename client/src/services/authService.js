import api from './api';

const authService = {
  signup: (payload) => api.post('/auth/signup', payload).then((res) => res.data),
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data),
  logout: () => api.post('/auth/logout').then((res) => res.data),
  me: () => api.get('/auth/me').then((res) => res.data),
  updateProfile: (payload) => api.put('/auth/profile', payload).then((res) => res.data),
  updatePassword: (payload) => api.put('/auth/password', payload).then((res) => res.data),
  updateSettings: (payload) => api.put('/auth/settings', payload).then((res) => res.data),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload).then((res) => res.data),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload).then((res) => res.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((res) => res.data),
};

export default authService;
