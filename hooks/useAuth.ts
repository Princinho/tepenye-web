"use client";

import { useState, useEffect, useCallback } from "react";
import type { Utilisateur, AuthState } from "@/types";

const TOKEN_KEY = "tepenye_token";
const USER_KEY = "tepenye_user";

export function useAuth(): AuthState & {
  login: (utilisateur: Utilisateur, token: string) => void;
  logout: () => void;
} {
  const [auth, setAuth] = useState<AuthState>({
    utilisateur: null,
    token: null,
    estConnecte: false,
  });

  // Recharge l'auth depuis localStorage au montage
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      try {
        const utilisateur = JSON.parse(userStr) as Utilisateur;
        setAuth({ utilisateur, token, estConnecte: true });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  const login = useCallback((utilisateur: Utilisateur, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(utilisateur));
    setAuth({ utilisateur, token, estConnecte: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ utilisateur: null, token: null, estConnecte: false });
  }, []);

  return { ...auth, login, logout };
}