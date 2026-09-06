import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kd_token') || '');

  useEffect(() => {
    const savedUser = localStorage.getItem('kd_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        logout();
      }
    }
  }, [token]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('kd_token', jwtToken);
    localStorage.setItem('kd_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('kd_token');
    localStorage.removeItem('kd_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
