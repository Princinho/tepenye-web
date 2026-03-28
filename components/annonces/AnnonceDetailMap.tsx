"use client";

import { Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Annonce } from "@/types";

interface AnnonceDetailMapProps {
  annonce: Annonce;
}

export default function AnnonceDetailMap({ annonce }: AnnonceDetailMapProps) {
  const position = {
    lat: annonce.localisation.lat,
    lng: annonce.localisation.lng,
  };

  return (
    <Map
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
      defaultCenter={position}
      defaultZoom={15}
      style={{ width: "100%", height: "300px", borderRadius: "12px" }}
      gestureHandling="greedy"
      disableDefaultUI={false}
    >
      <AdvancedMarker position={position}>
        <div
          style={{
            background: "#059669",
            color: "white",
            border: "2px solid #059669",
            borderRadius: "20px",
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(5,150,105,0.4)",
          }}
        >
          📍 {annonce.quartier}
        </div>
      </AdvancedMarker>
    </Map>
  );
}