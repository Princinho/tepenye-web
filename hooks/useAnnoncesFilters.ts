import { useState, useMemo } from "react";
import type { Annonce, FiltresAnnonce } from "@/types";

export interface ZoneRecherche {
  lat: number;
  lng: number;
  label: string;
  rayonKm: number;
}

// Calcule la distance en km entre deux coordonnées (formule Haversine)
function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FILTRES_VIDES: FiltresAnnonce = {};

export function useAnnoncesFilters(annonces: Annonce[] | undefined) {
  const [filtres, setFiltres] = useState<FiltresAnnonce>(FILTRES_VIDES);
  const [zone, setZone] = useState<ZoneRecherche | null>(null);

  const annoncesFilrees = useMemo(() => {
    if (!annonces) return [];

    return annonces.filter((annonce) => {
      // Filtre type offre
      if (filtres.typeOffre && annonce.typeOffre !== filtres.typeOffre) return false;

      // Filtre type bien
      if (filtres.typeBien && annonce.typeBien !== filtres.typeBien) return false;

      // Filtre prix min
      if (filtres.prixMin && annonce.prixMensuelNormalise < filtres.prixMin) return false;

      // Filtre prix max
      if (filtres.prixMax && annonce.prixMensuelNormalise > filtres.prixMax) return false;

      // Filtre pièces min
      if (filtres.nombrePiecesMin && annonce.nombrePieces < filtres.nombrePiecesMin) return false;

      // Filtre meublé
      if (filtres.estMeuble && !annonce.estMeuble) return false;

      // Filtre climatisation
      if (filtres.aClimatisation && !annonce.aClimatisation) return false;

      // Filtre garage
      if (filtres.aGarage && !annonce.aGarage) return false;

      // Filtre zone géographique
      if (zone) {
        const dist = distanceKm(
          zone.lat, zone.lng,
          annonce.localisation.lat, annonce.localisation.lng
        );
        if (dist > zone.rayonKm) return false;
      }

      return true;
    });
  }, [annonces, filtres, zone]);

  const reinitialiser = () => {
    setFiltres(FILTRES_VIDES);
    setZone(null);
  };

  const nombreFiltresActifs =
    Object.values(filtres).filter(Boolean).length + (zone ? 1 : 0);

  return {
    filtres,
    setFiltres,
    zone,
    setZone,
    annoncesFilrees,
    reinitialiser,
    nombreFiltresActifs,
  };
}