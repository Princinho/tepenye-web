"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthContext } from "@/lib/AuthContext";
import { useAnnoncesAgent } from "@/hooks/useAnnonces";
import { formatPrix, formatPeriode, formatDate } from "@/lib/utils";
import type { Annonce } from "@/types";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const styles: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700",
    Expiree: "bg-gray-100 text-gray-500",
    Brouillon: "bg-amber-100 text-amber-700",
    EnCoursValidation: "bg-blue-100 text-blue-700",
  };
  const labels: Record<string, string> = {
    Active: "Active",
    Expiree: "Expirée",
    Brouillon: "Brouillon",
    EnCoursValidation: "En validation",
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[statut] ?? "bg-gray-100 text-gray-500"}`}>
      {labels[statut] ?? statut}
    </span>
  );
}

function AnnonceRow({ annonce }: { annonce: Annonce }) {
  const photo = annonce.medias?.[0]?.url;
  const joursRestants = Math.max(
    0,
    Math.ceil((new Date(annonce.dateExpiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors rounded-xl">
      {/* Photo */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {photo && (
          <Image src={photo} alt={annonce.titre} fill className="object-cover" sizes="64px" />
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Link
            href={`/annonces/${annonce.id}`}
            className="text-sm font-medium text-gray-900 hover:text-emerald-600 truncate transition-colors"
          >
            {annonce.titre}
          </Link>
          <StatutBadge statut={annonce.statutAnnonce} />
        </div>
        <p className="text-xs text-gray-500 mb-1">
          {formatPrix(annonce.prix)} {formatPeriode(annonce.periodePaiementJours)} · {annonce.quartier}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>👁 {annonce.statistiques.nombreVues} vues</span>
          <span>♡ {annonce.statistiques.nombreFavoris} favoris</span>
          <span>💬 {annonce.statistiques.nombreClicsContact} contacts</span>
          {annonce.statutAnnonce === "Active" && joursRestants <= 3 && (
            <span className="text-amber-500 font-medium">
              ⚠ Expire dans {joursRestants}j
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/annonces/${annonce.id}`}
          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors"
        >
          Voir
        </Link>
        <button className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors">
          Modifier
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { estConnecte, utilisateur } = useAuthContext();
  const { data: annonces, isLoading } = useAnnoncesAgent(utilisateur?.id ?? "");

  // Redirect si non connecté
  useEffect(() => {
    if (!estConnecte) {
      router.push("/login");
    }
  }, [estConnecte, router]);

  if (!estConnecte || !utilisateur) return null;

  const annoncesActives = annonces?.filter((a) => a.statutAnnonce === "Active") ?? [];
  const annoncesExpirees = annonces?.filter((a) => a.statutAnnonce === "Expiree") ?? [];
  const totalVues = annonces?.reduce((acc, a) => acc + a.statistiques.nombreVues, 0) ?? 0;
  const totalContacts = annonces?.reduce((acc, a) => acc + a.statistiques.nombreClicsContact, 0) ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Bonjour, {utilisateur.nom.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {utilisateur.typeUtilisateur} · {utilisateur.email}
          </p>
        </div>
        <Link
          href="/publier"
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          + Nouvelle annonce
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Annonces actives"
          value={annoncesActives.length}
          sub={`/ 4 gratuites`}
        />
        <StatCard
          label="Total vues"
          value={totalVues.toLocaleString()}
          sub="Toutes annonces"
        />
        <StatCard
          label="Contacts reçus"
          value={totalContacts}
          sub="Demandes clients"
        />
        <StatCard
          label="Crédits disponibles"
          value={utilisateur.soldeCredits}
          sub={utilisateur.abonne ? "Abonné ✓" : "Compte gratuit"}
        />
      </div>

      {/* Annonces */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">
            Mes annonces
            {annonces && (
              <span className="ml-2 text-sm text-gray-400 font-normal">
                ({annonces.length})
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {annoncesActives.length} actives
            </span>
            {annoncesExpirees.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {annoncesExpirees.length} expirées
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : annonces && annonces.length > 0 ? (
          <div className="divide-y divide-gray-50 px-2">
            {annonces.map((annonce) => (
              <AnnonceRow key={annonce.id} annonce={annonce} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="text-4xl mb-3">🏠</div>
            <p className="text-gray-600 font-medium mb-1">Aucune annonce publiée</p>
            <p className="text-gray-400 text-sm mb-6">
              Publiez votre première annonce et commencez à recevoir des demandes.
            </p>
            <Link
              href="/publier"
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors inline-block"
            >
              Publier une annonce
            </Link>
          </div>
        )}
      </div>

      {/* Crédits */}
      {!utilisateur.abonne && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-1">
                Vous avez {utilisateur.soldeCredits} crédits disponibles
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Utilisez vos crédits pour révéler les contacts des clients intéressés par vos annonces.
              </p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { pack: "Starter", prix: "1 000", credits: 10 },
                  { pack: "Standard", prix: "3 000", credits: 35 },
                  { pack: "Pro", prix: "5 000", credits: 70 },
                ].map((p) => (
                  <button
                    key={p.pack}
                    className="px-4 py-2 bg-white border border-emerald-200 rounded-lg text-sm hover:border-emerald-400 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{p.pack}</span>
                    <span className="text-gray-500 ml-1">— {p.credits} crédits / {p.prix} FCFA</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}