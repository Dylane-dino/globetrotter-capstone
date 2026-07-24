"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as api from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    preferred_tags: string[];
    budget_level?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "globetrotter_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session on first load, and confirm the token is still valid
  // with the backend rather than trusting whatever's in storage forever.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setIsLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { token: string; user: User };
      api
        .getMe(parsed.token)
        .then((freshUser) => {
          setToken(parsed.token);
          setUser(freshUser);
        })
        .catch(() => {
          window.localStorage.removeItem(STORAGE_KEY);
        })
        .finally(() => setIsLoading(false));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      setIsLoading(false);
    }
  }, []);

  function persist(nextToken: string, nextUser: User) {
    setToken(nextToken);
    setUser(nextUser);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: nextToken, user: nextUser })
    );
  }

  async function login(email: string, password: string) {
    const res = await api.login({ email, password });
    persist(res.access_token, res.user);
  }

  async function signup(payload: {
    name: string;
    email: string;
    password: string;
    preferred_tags: string[];
    budget_level?: string;
  }) {
    const res = await api.signup(payload);
    persist(res.access_token, res.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
