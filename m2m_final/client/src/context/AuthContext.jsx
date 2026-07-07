import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('m2m_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const setAuth = (userData, token) => {
    localStorage.setItem('m2m_token', token);
    localStorage.setItem('m2m_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('m2m_token');
    localStorage.removeItem('m2m_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('m2m_user', JSON.stringify(data.user));
      }
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('m2m_token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, setAuth, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
