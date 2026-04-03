"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession, signOut } from "next-auth/react";
import type { Utilisateur, AuthState } from "@/types";

const TOKEN_KEY = "tepenye_token";
const USER_KEY = "tepenye_user";

// Durée du cookie : 30 jours (en secondes)
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/**
 * Écrit le token dans un cookie accessible par le middleware Next.js.
 * SameSite=Lax : protège contre CSRF tout en autorisant les navigations normales.
 * Pas httpOnly (doit être lisible par le middleware Edge côté serveur ET par JS).
 *
 * Note : en production, ajouter Secure; pour forcer HTTPS.
 */
function setCookieToken(token: string) {
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearCookieToken() {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

interface AuthContextType extends AuthState {
  login: (utilisateur: Utilisateur, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  utilisateur: null,
  token: null,
  estConnecte: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const [auth, setAuth] = useState<AuthState>({
    utilisateur: null,
    token: null,
    estConnecte: false,
  });

  // ── Synchronisation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return;

    // Priorité 1 : session next-auth (Google OAuth ou Credentials via next-auth)
    if (session?.utilisateur && session?.token) {
      setAuth({
        utilisateur: session.utilisateur as Utilisateur,
        token: session.token,
        estConnecte: true,
      });
      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.utilisateur));
      // Écrit aussi le cookie pour le middleware
      setCookieToken(session.token);
      return;
    }

    // Priorité 2 : localStorage (connexion email/OTP sans next-auth)
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const utilisateur = JSON.parse(userStr) as Utilisateur;
        setAuth({ utilisateur, token, estConnecte: true });
        // Re-sync du cookie au cas où il aurait expiré
        setCookieToken(token);
        return;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    setAuth({ utilisateur: null, token: null, estConnecte: false });
  }, [session, status]);

  // ── Méthodes ──────────────────────────────────────────────────────────────

  /** Connexion manuelle (email/OTP simulé hors next-auth) */
  const login = useCallback((utilisateur: Utilisateur, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(utilisateur));
    setCookieToken(token);
    setAuth({ utilisateur, token, estConnecte: true });
  }, []);

  /** Déconnexion : efface session next-auth, localStorage ET cookie */
  const logout = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearCookieToken();
    setAuth({ utilisateur: null, token: null, estConnecte: false });
    await signOut({ redirect: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);