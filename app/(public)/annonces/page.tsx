"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAnnonces } from "@/hooks/useAnnonces";
import { useAnnoncesFilters } from "@/hooks/useAnnoncesFilters";
import AnnonceCard from "@/components/annonces/AnnonceCard";
import FiltresPanel from "@/components/annonces/FiltresPanel";
import AlerteModal from "@/components/annonces/AlerteModal";

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

const ZoneRechercheInput = dynamic(
  () => import("@/components/annonces/ZoneRecherche"),
  { ssr: false }
);

export default function AnnoncesPage() {
  const { data: annonces, isLoading, isError } = useAnnonces();
  const [annonceActive, setAnnonceActive] = useState<string | null>(null);

  const {
    filtres,
    setFiltres,
    zone,
    setZone,
    annoncesFilrees,
    reinitialiser,
    nombreFiltresActifs,
  } = useAnnoncesFilters(annonces);

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

      {/* Header + barre de filtres */}
      <div className="flex-shrink-0 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Annonces immobilières
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {annoncesFilrees.length} bien{annoncesFilrees.length > 1 ? "s" : ""} trouvé{annoncesFilrees.length > 1 ? "s" : ""}
              {annonces && annoncesFilrees.length < annonces.length && (
                <span className="text-gray-400">
                  {" "}sur {annonces.length}
                </span>
              )}
            </p>
          </div>
          <AlerteModal
            filtres={filtres}
            zone={zone}
            nombreAnnonces={annoncesFilrees.length}
          />
        </div>

        {/* Barre de filtres */}
        <div className="flex items-center gap-3 flex-wrap">
          <FiltresPanel
            filtres={filtres}
            onChange={setFiltres}
            onReinitialiser={reinitialiser}
            nombreFiltresActifs={nombreFiltresActifs}
          />
          <ZoneRechercheInput
            zone={zone}
            onChange={setZone}
          />
          {nombreFiltresActifs > 0 && (
            <button
              onClick={reinitialiser}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2"
            >
              ✕ Réinitialiser tout
            </button>
          )}
        </div>
      </div>

      {/* Layout liste + carte */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">

        {/* Carte mobile — visible uniquement sur mobile, au dessus de la liste */}
        {zone && <div className="block md:hidden w-full h-48 flex-shrink-0">
          <AnnoncesMap
            annonces={annoncesFilrees}
            annonceActiveId={annonceActive}
            zone={zone}
          />
        </div>}

        {/* Liste scrollable */}
        <div className="w-full md:w-[420px] md:flex-shrink-0 overflow-y-auto space-y-4 pr-1">
          {annoncesFilrees.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-600 font-medium mb-1">Aucun bien trouvé</p>
              <p className="text-gray-400 text-sm mb-4">
                Essayez d&apos;élargir vos critères de recherche.
              </p>
              <button
                onClick={reinitialiser}
                className="text-sm text-emerald-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            annoncesFilrees.map((annonce) => (
              <div
                key={annonce.id}
                onMouseEnter={() => setAnnonceActive(annonce.id)}
                onMouseLeave={() => setAnnonceActive(null)}
                className={`rounded-xl transition-all duration-150 ${annonceActive === annonce.id ? "ring-2 ring-emerald-400" : ""
                  }`}
              >
                <AnnonceCard annonce={annonce} />
              </div>
            ))
          )}
        </div>

        {/* Carte desktop — cachée sur mobile */}
        <div className="hidden md:block flex-1 min-h-0">
          <AnnoncesMap
            annonces={annoncesFilrees}
            annonceActiveId={annonceActive}
            zone={zone}
          />
        </div>

      </div>
    </div>
  );
}