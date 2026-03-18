// @refresh reset
import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await getMe();
      setUser(res.data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const res = await apiLogin(email, password);
    setUser(res.data.data);
    setLoading(false);
    return res.data.data;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checkAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
