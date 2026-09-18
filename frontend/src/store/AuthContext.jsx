import { createContext, useContext, useEffect, useState } from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
} from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true: we don't know yet whether the auth cookie is valid until
  // /auth/me answers -- ProtectedRoute waits on this instead of bouncing
  // an already-logged-in user to /login on a page refresh.
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await getCurrentUser();
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then(({ data }) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await loginRequest({ email, password });
    setUser(data);
    return data;
  };

  const signup = async (payload) => {
    const { data } = await signupRequest(payload);
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
