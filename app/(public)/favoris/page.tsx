"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/lib/AuthContext";
import { useFavoris } from "@/hooks/useFavoris";
import { useAnnonces } from "@/hooks/useAnnonces";
import AnnonceCard from "@/components/annonces/AnnonceCard";

export default function FavorisPage() {
  const router = useRouter();
  const { utilisateur, estConnecte } = useAuthContext();
  const { data: favoris = [], isLoading: chargementFavoris } = useFavoris(
    utilisateur?.id
  );
  const { data: toutesAnnonces = [], isLoading: chargementAnnonces } =
    useAnnonces();

  useEffect(() => {
    if (!estConnecte) router.push("/login");
  }, [estConnecte, router]);

  if (!estConnecte) return null;

  const isLoading = chargementFavoris || chargementAnnonces;

  // Croise les IDs favoris avec les annonces complètes
  const annoncesFavorites = toutesAnnonces.filter((a) =>
    favoris.some((f) => f.annonceId === a.id)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mes favoris</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isLoading
            ? "Chargement..."
            : `${annoncesFavorites.length} annonce${annoncesFavorites.length > 1 ? "s" : ""} sauvegardée${annoncesFavorites.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Squelette chargement */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste */}
      {!isLoading && annoncesFavorites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {annoncesFavorites.map((annonce) => (
            <AnnonceCard key={annonce.id} annonce={annonce} />
          ))}
        </div>
      )}

      {/* État vide */}
      {!isLoading && annoncesFavorites.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">♡</div>
          <p className="text-gray-600 font-medium mb-1">
            Aucune annonce sauvegardée
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Cliquez sur ♡ sur n&apos;importe quelle annonce pour la retrouver ici.
          </p>
          <Link
            href="/annonces"
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors inline-block"
          >
            Parcourir les annonces
          </Link>
        </div>
      )}
    </div>
  );
}