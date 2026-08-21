import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email, password) {
    const res = await api.post("/api/auth/login", { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* still clear local session */
    }
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      login,
      logout,
      refresh,
      permissions: user?.permissions || [],
      can: (key) => Boolean(user?.isSuperAdmin || user?.permissions?.includes(key)),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
