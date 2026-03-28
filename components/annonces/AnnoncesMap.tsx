"use client";

import { Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import { useState } from "react";
import Link from "next/link";
import type { Annonce } from "@/types";
import { formatPrix, formatPeriode } from "@/lib/utils";

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
            boxShadow: isActive || isSelected
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
        <InfoWindow
          anchor={marker}
          onCloseClick={() => onSelect(null)}
        >
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
}

export default function AnnoncesMap({ annonces, annonceActiveId }: AnnoncesMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Map
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
      defaultCenter={{ lat: 6.1375, lng: 1.2123 }}
      defaultZoom={13}
      style={{ width: "100%", height: "100%", borderRadius: "12px" }}
      gestureHandling="greedy"
      disableDefaultUI={false}
    >
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