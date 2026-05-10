import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const r = await api.get('/users/me');
        if (!mounted) return;
        setUser(r.data);
        localStorage.setItem('user', JSON.stringify(r.data));
      } catch {
        if (!mounted) return;
        localStorage.clear();
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setLoading(false);
  };

  const refreshUser = async () => {
    try {
      const r = await api.get('/users/me');
      setUser(r.data);
      localStorage.setItem('user', JSON.stringify(r.data));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
