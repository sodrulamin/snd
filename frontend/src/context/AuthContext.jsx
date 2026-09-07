import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('snd_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('snd_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authService.getProfile()
        .then((res) => {
          if (res.data && res.data.success) {
            const profile = res.data.data;
            setUser((prev) => ({ ...prev, ...profile }));
            localStorage.setItem('snd_user', JSON.stringify({ ...user, ...profile }));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await authService.login({ username, password });
    if (res.data && res.data.success) {
      const data = res.data.data;
      setToken(data.token);
      setUser(data);
      localStorage.setItem('snd_token', data.token);
      localStorage.setItem('snd_user', JSON.stringify(data));
      return data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('snd_token');
    localStorage.removeItem('snd_user');
  };

  const refreshUserData = async () => {
    if (!token) return;
    try {
      const res = await authService.getProfile();
      if (res.data && res.data.success) {
        setUser((prev) => ({ ...prev, ...res.data.data }));
        localStorage.setItem('snd_user', JSON.stringify({ ...user, ...res.data.data }));
      }
    } catch (err) {
      console.error('Failed to refresh user profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'ADMIN',
        loading,
        login,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);