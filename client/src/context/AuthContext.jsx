import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('fl_token');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('fl_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('fl_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('fl_token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
