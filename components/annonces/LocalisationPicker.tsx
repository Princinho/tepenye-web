"use client";

import { Map, AdvancedMarker, MapMouseEvent } from "@vis.gl/react-google-maps";

interface LocalisationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  error?: string;
}

export default function LocalisationPicker({
  lat,
  lng,
  onChange,
  error,
}: LocalisationPickerProps) {
  const center = { lat: lat ?? 6.1375, lng: lng ?? 1.2123 };

  const handleClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      onChange(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl overflow-hidden border-2 transition-colors ${
          error ? "border-red-300" : lat ? "border-emerald-400" : "border-gray-200"
        }`}
      >
        <Map
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
          defaultCenter={center}
          defaultZoom={13}
          style={{ width: "100%", height: "350px" }}
          gestureHandling="greedy"
          onClick={handleClick}
          disableDefaultUI={false}
        >
          {lat && lng && (
            <AdvancedMarker position={{ lat, lng }}>
              <div
                style={{
                  background: "#059669",
                  color: "white",
                  border: "2px solid #fff",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  boxShadow: "0 2px 8px rgba(5,150,105,0.5)",
                }}
              />
            </AdvancedMarker>
          )}
        </Map>
      </div>

      {/* Coordonnées affichées */}
      {lat && lng ? (
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
          <span>✓ Position enregistrée —</span>
          <span className="font-mono">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
          <button
            type="button"
            onClick={() => onChange(6.1375, 1.2123)}
            className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      ) : (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          👆 Cliquez sur la carte pour placer le marqueur à l&apos;emplacement du bien
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}