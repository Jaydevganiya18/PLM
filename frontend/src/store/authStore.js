import { create } from 'zustand';
import api from '../utils/api';
import socket from '../utils/socket';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  login: async (credentials) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
      
      // Connect socket and join role room
      socket.connect();
      socket.emit('join_role_room', data.user.role);
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
    socket.disconnect();
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const { data } = await api.get('/auth/me');
        set({ user: data, isAuthenticated: true });
        socket.connect();
        socket.emit('join_role_room', data.role);
      } catch (error) {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      }
    } else {
      set({ isAuthenticated: false });
    }
  }
}));

export default useAuthStore;
