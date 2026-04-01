"use client";

import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
} from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Annonce } from "@/types";
import { formatPrix, formatPeriode } from "@/lib/utils";
import type { ZoneRecherche } from "@/hooks/useAnnoncesFilters";

// Composant interne pour gérer le recentrage et le cercle
function MapController({ zone }: { zone: ZoneRecherche | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !zone) return;

    // Recentre sur la zone
    map.setCenter({ lat: zone.lat, lng: zone.lng });
    map.setZoom(Math.max(11, Math.round(14 - Math.log2(zone.rayonKm))));

    // Dessine le cercle via l'API Google Maps native
    const cercle = new google.maps.Circle({
      map,
      center: { lat: zone.lat, lng: zone.lng },
      radius: zone.rayonKm * 1000,
      fillColor: "#3b82f6",
      fillOpacity: 0.08,
      strokeColor: "#3b82f6",
      strokeOpacity: 0.5,
      strokeWeight: 2,
    });

    // Marqueur central pour le point de référence
    const marqueurCentre = new google.maps.Marker({
      map,
      position: { lat: zone.lat, lng: zone.lng },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: zone.label,
    });

    return () => {
      cercle.setMap(null);
      marqueurCentre.setMap(null);
    };
  }, [map, zone]);

  // Recentre sur Lomé si pas de zone
  useEffect(() => {
    if (!map || zone) return;
    map.setCenter({ lat: 6.1375, lng: 1.2123 });
    map.setZoom(13);
  }, [map, zone]);

  return null;
}

interface MarkerWithInfoProps {
  annonce: Annonce;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}

function MarkerWithInfo({ annonce, isActive, isSelected, onSelect }: MarkerWithInfoProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: annonce.localisation.lat, lng: annonce.localisation.lng }}
        zIndex={isActive || isSelected ? 100 : 1}
        onClick={() => onSelect(isSelected ? null : annonce.id)}
      >
        <div
          style={{
            background: isActive || isSelected ? "#059669" : "#ffffff",
            color: isActive || isSelected ? "white" : "#059669",
            border: "2px solid #059669",
            borderRadius: "20px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow:
              isActive || isSelected
                ? "0 4px 12px rgba(5,150,105,0.4)"
                : "0 2px 6px rgba(0,0,0,0.15)",
            transform: isActive || isSelected ? "scale(1.15)" : "scale(1)",
            transition: "all 0.15s",
            cursor: "pointer",
          }}
        >
          {(annonce.prix / 1000).toFixed(0)}k FCFA
        </div>
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => onSelect(null)}>
          <div style={{ minWidth: "180px", fontFamily: "sans-serif" }}>
            <p style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px", color: "#111827" }}>
              {annonce.titre}
            </p>
            <p style={{ color: "#059669", fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>
              {formatPrix(annonce.prix)}
              <span style={{ color: "#6b7280", fontWeight: 400, fontSize: "11px" }}>
                {" "}{formatPeriode(annonce.periodePaiementJours)}
              </span>
            </p>
            <p style={{ color: "#6b7280", fontSize: "11px", marginBottom: "10px" }}>
              📍 {annonce.quartier}
            </p>
            <Link
              href={`/annonces/${annonce.id}`}
              style={{
                display: "block",
                background: "#059669",
                color: "white",
                textAlign: "center",
                padding: "7px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Voir l&apos;annonce →
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface AnnoncesMapProps {
  annonces: Annonce[];
  annonceActiveId: string | null;
  zone: ZoneRecherche | null;
}

export default function AnnoncesMap({ annonces, annonceActiveId, zone }: AnnoncesMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Map
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
      defaultCenter={{ lat: 6.1375, lng: 1.2123 }}
      defaultZoom={13}
      style={{ width: "100%", height: "100%", borderRadius: "12px" }}
      gestureHandling="greedy"
    >
      <MapController zone={zone} />

      {annonces.map((annonce) => (
        <MarkerWithInfo
          key={annonce.id}
          annonce={annonce}
          isActive={annonce.id === annonceActiveId}
          isSelected={annonce.id === selectedId}
          onSelect={setSelectedId}
        />
      ))}
    </Map>
  );
}