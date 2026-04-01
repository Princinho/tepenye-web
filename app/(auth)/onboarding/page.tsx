"use client";

/**
 * /onboarding — Choix du type de compte pour les nouveaux utilisateurs Google.
 *
 * Cette page est atteinte uniquement quand session.needsOnboarding === true,
 * c'est-à-dire lors du premier login Google (compte pas encore dans json-server).
 *
 * Elle :
 *  1. Affiche les trois options de rôle (Client, Agent, Agence)
 *  2. Crée le compte dans json-server avec le bon typeUtilisateur
 *  3. Met à jour le localStorage pour que AuthContext soit en sync
 *  4. Redirige vers /dashboard
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuthContext } from "@/lib/AuthContext";
import api from "@/lib/api";
import type { Utilisateur } from "@/types";

type TypeUtilisateur = "Client" | "Agent" | "Agence";

const ROLES: {
  type: TypeUtilisateur;
  emoji: string;
  titre: string;
  description: string;
}[] = [
  {
    type: "Client",
    emoji: "🔍",
    titre: "Chercheur de bien",
    description:
      "Je cherche un logement à louer ou à acheter. Accès gratuit à toutes les annonces.",
  },
  {
    type: "Agent",
    emoji: "🏠",
    titre: "Agent immobilier",
    description:
      "Je publie et gère des annonces. Jusqu'à 4 annonces gratuites, crédits pour les contacts.",
  },
  {
    type: "Agence",
    emoji: "🏢",
    titre: "Agence immobilière",
    description:
      "Je gère une équipe d'agents et un portefeuille de biens. Tableau de bord avancé.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const { login } = useAuthContext();

  const [roleSelectionne, setRoleSelectionne] = useState<TypeUtilisateur | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Garde-fou : si l'utilisateur arrive ici sans needsOnboarding, on redirige
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (session && !session.needsOnboarding) {
      // Compte déjà finalisé
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const handleValider = async () => {
    if (!roleSelectionne || !session?.utilisateur) return;
    setChargement(true);
    setErreur(null);

    try {
      // Vérifie si le compte n'a pas déjà été créé (double clic, etc.)
      const { data: existing } = await api.get<Utilisateur[]>(
        `/utilisateurs?email=${encodeURIComponent(session.utilisateur.email)}`
      );

      let utilisateur: Utilisateur;

      if (existing.length > 0) {
        utilisateur = existing[0];
      } else {
        // Crée le compte définitif dans json-server avec le bon rôle
        const { data: cree } = await api.post<Utilisateur>("/utilisateurs", {
          id: session.utilisateur.id,
          nom: session.utilisateur.nom,
          email: session.utilisateur.email,
          telephone: "",
          typeUtilisateur: roleSelectionne,
          estVerifie: false,
          soldeCredits: 10,
          abonne: false,
          dateInscription: new Date().toISOString(),
        });
        utilisateur = cree;
      }

      // Met à jour AuthContext + localStorage
      const token = btoa(
        JSON.stringify({ id: utilisateur.id, exp: Date.now() + 86_400_000 })
      );
      login(utilisateur, token);

      // Met à jour la session next-auth pour effacer needsOnboarding
      // et refléter le bon typeUtilisateur
      await update({
        utilisateur: { ...utilisateur },
        needsOnboarding: false,
      });

      router.replace("/dashboard");
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setChargement(false);
    }
  };

  // État de chargement initial
  if (status === "loading" || !session?.needsOnboarding) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">👋</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Bienvenue, {session.utilisateur.nom.split(" ")[0]} !
            </h1>
            <p className="text-sm text-gray-500">
              Pour personnaliser votre expérience, dites-nous comment vous allez
              utiliser Tepenye.
            </p>
          </div>

          {/* Sélection du rôle */}
          <div className="space-y-3 mb-6">
            {ROLES.map((role) => (
              <button
                key={role.type}
                onClick={() => setRoleSelectionne(role.type)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  roleSelectionne === role.type
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icône + indicateur de sélection */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        roleSelectionne === role.type
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-gray-300"
                      }`}
                    >
                      {roleSelectionne === role.type && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{role.emoji}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {role.titre}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Bonus crédits */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-5">
            <p className="text-xs text-emerald-700">
              🎁 10 crédits offerts dès la création de votre compte pour
              découvrir la plateforme
            </p>
          </div>

          {erreur && (
            <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{erreur}</p>
            </div>
          )}

          <button
            onClick={handleValider}
            disabled={!roleSelectionne || chargement}
            className={`w-full py-3 font-medium rounded-lg transition-colors text-sm ${
              roleSelectionne && !chargement
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {chargement
              ? "Création du compte..."
              : !roleSelectionne
              ? "Choisissez un type de compte"
              : "Créer mon compte →"}
          </button>
        </div>
      </div>
    </div>
  );
}