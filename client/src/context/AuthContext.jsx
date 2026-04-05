import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if already logged in on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        setOwner(res.data);
      } catch {
        setOwner(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setOwner(res.data.owner);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setOwner(null);
  };

  return (
    <AuthContext.Provider value={{ owner, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);