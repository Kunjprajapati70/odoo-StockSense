import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stocksense_token');
    if (!token) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    authService.me()
      .then((response) => {
        if (active) setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem('stocksense_token');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isManager: user?.role === 'inventory_manager',
    async login(payload) {
      const response = await authService.login(payload);
      localStorage.setItem('stocksense_token', response.data.token);
      setUser(response.data.user);
      return response;
    },
    async signup(payload) {
      const response = await authService.signup(payload);
      localStorage.setItem('stocksense_token', response.data.token);
      setUser(response.data.user);
      return response;
    },
    async logout() {
      try { await authService.logout(); } catch { /* session is cleared locally */ }
      localStorage.removeItem('stocksense_token');
      setUser(null);
    },
    setUser,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
