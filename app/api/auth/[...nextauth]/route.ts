import NextAuth, { Session, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// ─── Types ────────────────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    utilisateur: {
      id: string;
      nom: string;
      email: string;
      telephone: string;
      typeUtilisateur: "Client" | "Agent" | "Agence";
      estVerifie: boolean;
      soldeCredits: number;
      abonne: boolean;
      dateInscription: string;
    };
    token: string;
    /** true uniquement lors du premier login Google — redirige vers /onboarding */
    needsOnboarding: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    utilisateur?: Session["utilisateur"];
    tepenyeToken?: string;
    needsOnboarding?: boolean;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetchUtilisateurByEmail(email: string) {
  try {
    const res = await fetch(
      `${API_URL}/utilisateurs?email=${encodeURIComponent(email)}`
    );
    if (!res.ok) return null;
    const users = await res.json();
    return users[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchUtilisateurByTelephone(telephone: string) {
  try {
    const res = await fetch(
      `${API_URL}/utilisateurs?telephone=${encodeURIComponent(telephone)}`
    );
    if (!res.ok) return null;
    const users = await res.json();
    return users[0] ?? null;
  } catch {
    return null;
  }
}

export async function creerUtilisateur(data: {
  id?: string;
  nom: string;
  email: string;
  telephone?: string;
  typeUtilisateur?: "Client" | "Agent" | "Agence";
}) {
  const nouvelUtilisateur = {
    id: data.id ?? `u${Date.now()}`,
    nom: data.nom,
    email: data.email,
    telephone: data.telephone ?? "",
    typeUtilisateur: data.typeUtilisateur ?? "Client",
    estVerifie: false,
    soldeCredits: 10,
    abonne: false,
    dateInscription: new Date().toISOString(),
  };
  const res = await fetch(`${API_URL}/utilisateurs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nouvelUtilisateur),
  });
  return res.ok ? ((await res.json()) as typeof nouvelUtilisateur) : null;
}

function genererToken(id: string): string {
  return btoa(JSON.stringify({ id, exp: Date.now() + 86_400_000 }));
}

// ─── Configuration ────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    CredentialsProvider({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        motDePasse: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.motDePasse) return null;
        const utilisateur = await fetchUtilisateurByEmail(credentials.email);
        if (!utilisateur) return null;
        return {
          id: utilisateur.id,
          name: utilisateur.nom,
          email: utilisateur.email,
          image: JSON.stringify(utilisateur),
        };
      },
    }),

    CredentialsProvider({
      id: "otp-telephone",
      name: "Téléphone OTP",
      credentials: {
        telephone: { label: "Téléphone", type: "text" },
        codeValide: { label: "Code validé", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.telephone || credentials.codeValide !== "true")
          return null;

        let utilisateur = await fetchUtilisateurByTelephone(
          credentials.telephone
        );
        if (!utilisateur) {
          utilisateur = await creerUtilisateur({
            nom: `Utilisateur ${credentials.telephone.slice(-4)}`,
            email: `${credentials.telephone.replace(/\D/g, "")}@tepenye.tg`,
            telephone: credentials.telephone,
          });
          if (!utilisateur) return null;
        }
        return {
          id: utilisateur.id,
          name: utilisateur.nom,
          email: utilisateur.email,
          image: JSON.stringify(utilisateur),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Credentials (email ou OTP) — utilisateur sérialisé dans user.image
        if (user.image && user.image.startsWith("{")) {
          try {
            token.utilisateur = JSON.parse(user.image);
            token.needsOnboarding = false;
          } catch { /* ignore */ }
        }

        // Google OAuth
        if (account?.provider === "google" && token.email) {
          const existant = await fetchUtilisateurByEmail(token.email);

          if (existant) {
            // Compte déjà connu → connexion directe, pas d'onboarding
            token.utilisateur = existant;
            token.needsOnboarding = false;
          } else {
            // Nouveau compte Google → on prépare un profil provisoire dans le JWT.
            // Le compte n'est PAS encore créé dans json-server.
            // La création définitive (avec le bon typeUtilisateur) se fait dans /onboarding.
            token.utilisateur = {
              id: `u${Date.now()}`,
              nom: token.name ?? token.email ?? "Utilisateur",
              email: token.email ?? "",
              telephone: "",
              typeUtilisateur: "Client", // temporaire
              estVerifie: false,
              soldeCredits: 10,
              abonne: false,
              dateInscription: new Date().toISOString(),
            };
            token.needsOnboarding = true;
          }
        }

        if (token.utilisateur) {
          token.tepenyeToken = genererToken(token.utilisateur.id);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.utilisateur) {
        session.utilisateur = token.utilisateur;
        session.token = token.tepenyeToken ?? "";
        session.needsOnboarding = token.needsOnboarding ?? false;
      }
      return session;
    },

    // Laisse next-auth gérer les redirections internes normalement.
    // La logique onboarding est gérée côté client (useSession dans login/page.tsx).
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET ?? "tepenye-dev-secret-change-in-prod",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };