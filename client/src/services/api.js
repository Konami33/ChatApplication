import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  register: (username, password) => 
    api.post('/auth/signup', { username, password }),
};

export const chat = {
  getRooms: () => api.get('/chat/rooms'),
  getMessages: (roomId) => api.get(`/chat/rooms/${roomId}/messages`),
  sendMessage: (roomId, userId, message) => 
    api.post('/chat/message', { roomId, userId, message }),
};

export default api; 