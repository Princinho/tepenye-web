"use client";

/**
 * AuthContext — Tepenye
 *
 * Fusionne next-auth (Google OAuth + Credentials) avec l'état local
 * déjà utilisé dans tout le projet (utilisateur, token, estConnecte).
 *
 * Stratégie :
 *  - Si une session next-auth est active → on l'utilise comme source de vérité
 *  - Sinon → on tombe sur le localStorage (connexion email simulée avant next-auth)
 *  - login() / logout() restent disponibles pour la compat avec le reste du code
 */

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
      // Synchronise aussi le localStorage pour que api.ts (axios interceptor) ait le token
      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(session.utilisateur)
      );
      return;
    }

    // Priorité 2 : localStorage (connexion email/OTP sans next-auth)
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const utilisateur = JSON.parse(userStr) as Utilisateur;
        setAuth({ utilisateur, token, estConnecte: true });
        return;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    // Aucune auth trouvée
    setAuth({ utilisateur: null, token: null, estConnecte: false });
  }, [session, status]);

  // ── Méthodes ──────────────────────────────────────────────────────────────

  /** Connexion manuelle (email/OTP simulé hors next-auth) */
  const login = useCallback((utilisateur: Utilisateur, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(utilisateur));
    setAuth({ utilisateur, token, estConnecte: true });
  }, []);

  /** Déconnexion : efface la session next-auth ET le localStorage */
  const logout = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ utilisateur: null, token: null, estConnecte: false });
    // Déconnecte la session next-auth si elle existe (Google, etc.)
    await signOut({ redirect: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);