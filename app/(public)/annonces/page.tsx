"use client";

import { useAnnonces } from "@/hooks/useAnnonces";
import AnnonceCard from "@/components/annonces/AnnonceCard";

export default function AnnoncesPage() {
  const { data: annonces, isLoading, isError } = useAnnonces();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Erreur lors du chargement des annonces.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Annonces immobilières
        </h1>
        <p className="text-gray-500 mt-1">
          {annonces?.length} bien{(annonces?.length ?? 0) > 1 ? "s" : ""} disponible{(annonces?.length ?? 0) > 1 ? "s" : ""}
        </p>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {annonces?.map((annonce) => (
          <AnnonceCard key={annonce.id} annonce={annonce} />
        ))}
      </div>
    </div>
  );
}