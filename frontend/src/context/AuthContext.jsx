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
    try {
      const res = await authService.login({ username, password });
      if (res.data && res.data.success) {
        const data = res.data.data;
        setToken(data.token);
        setUser(data);
        localStorage.setItem('snd_token', data.token);
        localStorage.setItem('snd_user', JSON.stringify(data));
        return data;
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      let message = 'Login failed';
      if (err.response?.data) {
        const resData = err.response.data;
        if (typeof resData === 'string') {
          message = resData;
        } else if (resData.data && typeof resData.data === 'object' && !Array.isArray(resData.data)) {
          const fieldErrors = Object.values(resData.data).filter(Boolean);
          message = fieldErrors.length > 0 ? fieldErrors.join(', ') : (resData.message || message);
        } else if (resData.message) {
          message = resData.message;
        }
      } else if (err.message) {
        message = err.message;
      }

      const enhancedError = new Error(message);
      enhancedError.response = err.response;
      throw enhancedError;
    }
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

  const updateUserProfile = async (profileData) => {
    const res = await authService.updateProfile(profileData);
    if (res.data && res.data.success) {
      const updated = res.data.data;
      setUser((prev) => ({ ...prev, ...updated }));
      try {
        const saved = localStorage.getItem('snd_user');
        const parsed = saved ? JSON.parse(saved) : {};
        localStorage.setItem('snd_user', JSON.stringify({ ...parsed, ...updated }));
      } catch (e) {}
      return updated;
    }
    throw new Error(res.data?.message || 'Failed to update profile');
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
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);