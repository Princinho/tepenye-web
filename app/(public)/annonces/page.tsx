"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAnnonces } from "@/hooks/useAnnonces";
import AnnonceCard from "@/components/annonces/AnnonceCard";

const AnnoncesMap = dynamic(
  () => import("@/components/annonces/AnnoncesMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chargement de la carte...</p>
      </div>
    ),
  }
);

export default function AnnoncesPage() {
  const { data: annonces, isLoading, isError } = useAnnonces();
  const [annonceActive, setAnnonceActive] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex gap-6" style={{ height: "calc(100vh - 8rem)" }}>
        <div className="w-[420px] flex-shrink-0 space-y-4 overflow-y-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-gray-100 rounded-xl animate-pulse" />
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
    <div className="flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Annonces immobilières
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {annonces?.length} bien{(annonces?.length ?? 0) > 1 ? "s" : ""} disponible{(annonces?.length ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Layout liste + carte */}
      <div className="flex gap-6 flex-1 min-h-0">

        {/* Liste scrollable à gauche */}
        <div className="w-[420px] flex-shrink-0 overflow-y-auto space-y-4 pr-1">
          {annonces?.map((annonce) => (
            <div
              key={annonce.id}
              onMouseEnter={() => setAnnonceActive(annonce.id)}
              onMouseLeave={() => setAnnonceActive(null)}
              className={`rounded-xl transition-all duration-150 ${
                annonceActive === annonce.id
                  ? "ring-2 ring-emerald-400"
                  : ""
              }`}
            >
              <AnnonceCard annonce={annonce} />
            </div>
          ))}
        </div>

        {/* Carte sticky à droite */}
        <div className="flex-1 min-h-0">
          <AnnoncesMap
            annonces={annonces ?? []}
            annonceActiveId={annonceActive}
          />
        </div>

      </div>
    </div>
  );
}