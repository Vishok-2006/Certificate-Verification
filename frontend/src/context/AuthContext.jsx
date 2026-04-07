import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setAuthToken(token);
      setUser(JSON.parse(storedUser));
      apiClient.get('/api/auth/me').then((response) => {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthToken(null);
        setUser(null);
      }).finally(() => setLoading(false));
      return;
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setAuthToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (payload) => {
    const response = await apiClient.post('/api/auth/register', payload);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setAuthToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout, register }), [user, loading]);
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
