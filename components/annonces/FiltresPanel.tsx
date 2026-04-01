"use client";

import { useState } from "react";
import type { FiltresAnnonce } from "@/types";

interface FiltresPanelProps {
  filtres: FiltresAnnonce;
  onChange: (filtres: FiltresAnnonce) => void;
  onReinitialiser: () => void;
  nombreFiltresActifs: number;
}

export default function FiltresPanel({
  filtres,
  onChange,
  onReinitialiser,
  nombreFiltresActifs,
}: FiltresPanelProps) {
  const [ouvert, setOuvert] = useState(false);

  const update = (key: keyof FiltresAnnonce, value: any) => {
    onChange({ ...filtres, [key]: value || undefined });
  };

  return (
    <div className="relative">
      {/* Bouton toggle filtres */}
      <button
        onClick={() => setOuvert(!ouvert)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${nombreFiltresActifs > 0
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
          }`}
      >
        <span>Filtres</span>
        {nombreFiltresActifs > 0 && (
          <span className="bg-white text-emerald-600 text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
            {nombreFiltresActifs}
          </span>
        )}
        <span className="text-xs">{ouvert ? "▲" : "▼"}</span>
      </button>

      {/* Panel filtres */}
      {ouvert && (
        <div className="
              fixed md:absolute
              left-2 right-2 md:left-0 md:right-auto
              top-auto md:top-12
              bottom-4 md:bottom-auto
              z-40 bg-white border border-gray-200 rounded-xl shadow-lg p-5
              md:w-[520px] space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-800">Filtres de recherche</h3>
            <div className="flex items-center gap-3">
              {nombreFiltresActifs > 0 && (
                <button
                  onClick={() => { onReinitialiser(); setOuvert(false); }}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
              <button
                onClick={() => setOuvert(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type d'offre */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Type d&apos;offre</label>
              <div className="flex gap-2">
                {["Location", "Vente"].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      update("typeOffre", filtres.typeOffre === type ? undefined : type)
                    }
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${filtres.typeOffre === type
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-gray-200 text-gray-600 hover:border-emerald-300"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Type de bien */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Type de bien</label>
              <select
                value={filtres.typeBien ?? ""}
                onChange={(e) => update("typeBien", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              >
                <option value="">Tous les types</option>
                {["Villa", "Maison", "Appartement", "Studio", "Bureau", "Terrain"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Prix min */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Budget min (FCFA/mois)</label>
              <input
                type="number"
                placeholder="0"
                value={filtres.prixMin ?? ""}
                onChange={(e) => update("prixMin", Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>

            {/* Prix max */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Budget max (FCFA/mois)</label>
              <input
                type="number"
                placeholder="Illimité"
                value={filtres.prixMax ?? ""}
                onChange={(e) => update("prixMax", Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>

            {/* Pièces min */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Pièces minimum</label>
              <select
                value={filtres.nombrePiecesMin ?? ""}
                onChange={(e) => update("nombrePiecesMin", Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              >
                <option value="">Peu importe</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}+ pièce{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Options booléennes */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Équipements</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "estMeuble" as const, label: "Meublé" },
                { key: "aClimatisation" as const, label: "Climatisation" },
                { key: "aGarage" as const, label: "Garage" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => update(opt.key, !filtres[opt.key] || undefined)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filtres[opt.key]
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-200 text-gray-600 hover:border-emerald-300"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setOuvert(false)}
            className="w-full py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Appliquer les filtres
          </button>
        </div>
      )}
    </div>
  );
}