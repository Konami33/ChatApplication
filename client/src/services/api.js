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
  sendMessage: (roomId, message) => api.post('/chat/message', { 
    roomId, 
    message 
  }),
  createRoom: (name) => api.post('/chat/rooms', { name }),
  getRoomUsers: (roomId) => api.get(`/chat/rooms/${roomId}/users`),
  getRoomById: (roomId) => api.get(`/chat/rooms/${roomId}`).catch(error => {
    if (error.response?.status === 404) {
      throw new Error('Room not found');
    }
    throw error;
  }),
  joinRoom: (roomId) => api.post(`/chat/rooms/${roomId}/join`).catch(error => {
    if (error.response?.status === 404) {
      throw new Error('Room not found');
    }
    if (error.response?.status === 409) {
      throw new Error('Already a member of this room');
    }
    throw error;
  }),
};

export default api; 