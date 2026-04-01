"use client";

import { useState } from "react";
import type { FiltresAnnonce } from "@/types";
import type { ZoneRecherche } from "@/hooks/useAnnoncesFilters";

interface AlerteModalProps {
  filtres: FiltresAnnonce;
  zone: ZoneRecherche | null;
  nombreAnnonces: number;
}

export default function AlerteModal({
  filtres,
  zone,
  nombreAnnonces,
}: AlerteModalProps) {
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);

  const nombreFiltresActifs =
    Object.values(filtres).filter(Boolean).length + (zone ? 1 : 0);

  const creerAlerte = () => {
    if (!email) return;
    // En prod, appel API POST /alertes avec les filtres et l'email
    // Pour l'instant on simule
    console.log("Alerte créée", { email, filtres, zone });
    setEnvoye(true);
    setTimeout(() => {
      setOuvert(false);
      setEnvoye(false);
      setEmail("");
    }, 2000);
  };

  const resumeFiltres = () => {
    const parts: string[] = [];
    if (filtres.typeOffre) parts.push(filtres.typeOffre);
    if (filtres.typeBien) parts.push(filtres.typeBien);
    if (filtres.prixMax) parts.push(`max ${filtres.prixMax.toLocaleString()} FCFA`);
    if (filtres.nombrePiecesMin) parts.push(`${filtres.nombrePiecesMin}+ pièces`);
    if (zone) parts.push(`à ${zone.rayonKm}km de ${zone.label}`);
    return parts.length > 0 ? parts.join(" · ") : "Toutes les annonces";
  };

  return (
    <>
      {/* Bouton créer alerte */}
      <button
        onClick={() => setOuvert(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-600 transition-colors"
      >
        <span>🔔</span>
        <span>Créer une alerte</span>
      </button>

      {/* Modal */}
      {ouvert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setOuvert(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-5">
            {envoye ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-base font-medium text-gray-900">Alerte créée !</p>
                <p className="text-sm text-gray-500 mt-1">
                  Vous serez notifié dès qu&apos;une nouvelle annonce correspond à vos critères.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Créer une alerte
                  </h3>
                  <p className="text-xs text-gray-500">
                    Recevez une notification dès qu&apos;une nouvelle annonce correspond à votre recherche.
                  </p>
                </div>

                {/* Résumé des filtres */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    Alerte basée sur vos filtres actuels
                  </p>
                  <p className="text-xs text-amber-600">{resumeFiltres()}</p>
                  <p className="text-xs text-amber-500 mt-1">
                    {nombreAnnonces} annonce{nombreAnnonces > 1 ? "s" : ""} correspondent actuellement
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">
                    Votre adresse email
                  </label>
                  <input
                    type="email"
                    placeholder="vous@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-amber-500"
                  />
                </div>

                <p className="text-xs text-gray-400">
                  En créant une alerte, vous acceptez de recevoir des emails de Tepenye. Vous pourrez vous désabonner à tout moment.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setOuvert(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={creerAlerte}
                    disabled={!email}
                    className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                      email
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    🔔 Créer l&apos;alerte
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}