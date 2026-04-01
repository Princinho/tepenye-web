"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import type { ZoneRecherche } from "@/hooks/useAnnoncesFilters";

interface Suggestion {
    placeId: string;
    description: string;
    mainText: string;
}

interface ZoneRechercheProps {
    zone: ZoneRecherche | null;
    onChange: (zone: ZoneRecherche | null) => void;
}

export default function ZoneRechercheInput({ zone, onChange }: ZoneRechercheProps) {
    const [ouvert, setOuvert] = useState(false);
    const [rayon, setRayon] = useState(zone?.rayonKm ?? 2);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [chargement, setChargement] = useState(false);

    const placesLib = useMapsLibrary("places");
    const geocoderLib = useMapsLibrary("geocoding");
    const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialise les services
    useEffect(() => {
        if (placesLib && !serviceRef.current) {
            serviceRef.current = new placesLib.AutocompleteService();
        }
    }, [placesLib]);

    useEffect(() => {
        if (geocoderLib && !geocoderRef.current) {
            geocoderRef.current = new geocoderLib.Geocoder();
        }
    }, [geocoderLib]);

    // Debounce la recherche
    const rechercherSuggestions = useCallback((value: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (!value.trim() || value.length < 2) {
            setSuggestions([]);
            return;
        }

        timerRef.current = setTimeout(async () => {
            if (!serviceRef.current) return;
            setChargement(true);

            try {
                serviceRef.current.getPlacePredictions(
                    {
                        input: value,
                        componentRestrictions: { country: "tg" },
                    },
                    (predictions, status) => {
                        setChargement(false);
                        if (
                            status === google.maps.places.PlacesServiceStatus.OK &&
                            predictions
                        ) {
                            setSuggestions(
                                predictions.map((p) => ({
                                    placeId: p.place_id,
                                    description: p.description,
                                    mainText: p.structured_formatting.main_text,
                                }))
                            );
                        } else {
                            setSuggestions([]);
                        }
                    }
                );
            } catch {
                setChargement(false);
                setSuggestions([]);
            }
        }, 350);
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        rechercherSuggestions(value);
    };

    const selectionnerSuggestion = (suggestion: Suggestion) => {
        if (!geocoderRef.current) return;

        geocoderRef.current.geocode(
            { placeId: suggestion.placeId },
            (results, status) => {
                if (status === "OK" && results?.[0]?.geometry?.location) {
                    const location = results[0].geometry.location;
                    onChange({
                        lat: location.lat(),
                        lng: location.lng(),
                        label: suggestion.mainText,
                        rayonKm: rayon,
                    });
                    setQuery(suggestion.mainText);
                    setSuggestions([]);
                    setOuvert(false);
                }
            }
        );
    };

    // Met à jour le rayon sur la zone existante
    useEffect(() => {
        if (zone) onChange({ ...zone, rayonKm: rayon });
    }, [rayon]);

    return (
        <div className="relative">
            {/* Bouton toggle */}
            <button
                onClick={() => setOuvert(!ouvert)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${zone
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                    }`}
            >
                <span>📍</span>
                <span>
                    {zone ? `Autour de ${zone.label}` : "Rechercher par zone"}
                </span>
                {zone && (
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                            setQuery("");
                        }}
                        className="ml-1 text-white/80 hover:text-white text-xs"
                    >
                        ✕
                    </span>
                )}
            </button>

            {/* Panel */}
            {ouvert && (
                <div className="
    fixed md:absolute
    left-2 right-2 md:left-0 md:right-auto
    top-auto md:top-12
    bottom-4 md:bottom-auto
    z-40 bg-white border border-gray-200 rounded-xl shadow-lg p-5
    md:w-[380px]
    space-y-4
  ">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-800">Recherche par proximité</h3>
                        <button
                            onClick={() => setOuvert(false)}
                            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                        >
                            ✕
                        </button>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">
                            Point de référence (quartier, école, hôpital...)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={handleInput}
                                placeholder="Ex: Université de Lomé, CHU Sylvanus..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                                autoComplete="off"
                            />
                            {chargement && (
                                <span className="absolute right-3 top-2.5 text-xs text-gray-400">...</span>
                            )}
                            {suggestions.length > 0 && (
                                <div className="
                                    absolute left-0 right-0 z-50
                                    bottom-full mb-1 md:bottom-auto md:top-full md:mt-1
                                    bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden
                                    max-h-48 overflow-y-auto
                                ">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s.placeId}
                                            type="button"
                                            onClick={() => selectionnerSuggestion(s)}
                                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                        >
                                            <span className="text-gray-800 font-medium">{s.mainText}</span>
                                            <span className="text-gray-400 text-xs block truncate">{s.description}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1.5 flex justify-between">
                            <span>Rayon de recherche</span>
                            <span className="font-medium text-blue-600">{rayon} km</span>
                        </label>
                        <input
                            type="range"
                            min={0.5}
                            max={15}
                            step={0.5}
                            value={rayon}
                            onChange={(e) => setRayon(Number(e.target.value))}
                            className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>500m</span>
                            <span>15 km</span>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400">
                        Tapez un lieu et sélectionnez dans la liste.
                    </p>
                </div>
            )}
        </div>
    );
}