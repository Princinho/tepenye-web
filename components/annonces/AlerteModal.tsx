"use client";

import { useState } from "react";
import Link from "next/link";
import type { FiltresAnnonce } from "@/types";
import type { ZoneRecherche } from "@/hooks/useAnnoncesFilters";
import { useAuthContext } from "@/lib/AuthContext";
import {
  useAlertes,
  useCreerAlerte,
  useSupprimerAlerte,
} from "@/hooks/useAlertes";

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
  const { utilisateur, estConnecte } = useAuthContext();
  const [ouvert, setOuvert] = useState(false);

  const { data: alertes = [] } = useAlertes(utilisateur?.id);
  const { mutate: creerAlerte, isPending: creationPending } = useCreerAlerte();
  const { mutate: supprimerAlerte, isPending: suppressionPending } =
    useSupprimerAlerte();

  const nombreFiltresActifs =
    Object.values(filtres).filter(Boolean).length + (zone ? 1 : 0);

  // Vérifie si une alerte identique existe déjà (même filtres + zone)
  const alerteExistante = alertes.find((a) => {
    const memesFiltres =
      JSON.stringify(a.filtres) === JSON.stringify(filtres);
    const memeZone = JSON.stringify(a.zone) === JSON.stringify(zone);
    return memesFiltres && memeZone;
  });

  const resumeFiltres = () => {
    const parts: string[] = [];
    if (filtres.typeOffre) parts.push(filtres.typeOffre);
    if (filtres.typeBien) parts.push(filtres.typeBien);
    if (filtres.prixMax)
      parts.push(`max ${filtres.prixMax.toLocaleString()} FCFA`);
    if (filtres.nombrePiecesMin)
      parts.push(`${filtres.nombrePiecesMin}+ pièces`);
    if (filtres.estMeuble) parts.push("Meublé");
    if (filtres.aClimatisation) parts.push("Climatisation");
    if (filtres.aGarage) parts.push("Garage");
    if (zone) parts.push(`à ${zone.rayonKm}km de ${zone.label}`);
    return parts.length > 0 ? parts.join(" · ") : "Toutes les annonces";
  };

  const handleCreer = () => {
    if (!utilisateur) return;
    creerAlerte(
      { utilisateurId: utilisateur.id, filtres, zone },
      { onSuccess: () => setOuvert(false) }
    );
  };

  const handleSupprimer = (alerteId: string) => {
    if (!utilisateur) return;
    supprimerAlerte({ alerteId, utilisateurId: utilisateur.id });
  };

  return (
    <>
      {/* Bouton — badge si alertes actives */}
      <button
        onClick={() => setOuvert(true)}
        className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-600 transition-colors"
      >
        <span>🔔</span>
        <span>Créer une alerte</span>
        {alertes.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">
            {alertes.length > 9 ? "9+" : alertes.length}
          </span>
        )}
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => e.target === e.currentTarget && setOuvert(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-5">

            {/* ── Non connecté ──────────────────────────────────────────── */}
            {!estConnecte ? (
              <>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Créer une alerte
                  </h3>
                  <p className="text-sm text-gray-500">
                    Connectez-vous pour sauvegarder cette recherche et être
                    notifié des nouvelles annonces correspondantes.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    Recherche à sauvegarder
                  </p>
                  <p className="text-xs text-amber-600">{resumeFiltres()}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOuvert(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <Link
                    href="/login"
                    className="flex-1 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors text-center"
                    onClick={() => setOuvert(false)}
                  >
                    Se connecter
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {alerteExistante ? "Alerte déjà active" : "Créer une alerte"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {alerteExistante
                      ? "Une alerte identique existe déjà pour cette recherche."
                      : "Vous serez notifié dès qu'une nouvelle annonce correspond à vos critères."}
                  </p>
                </div>

                {/* Résumé des filtres */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    {nombreFiltresActifs > 0
                      ? "Basée sur vos filtres actuels"
                      : "Toutes les nouvelles annonces"}
                  </p>
                  <p className="text-xs text-amber-600">{resumeFiltres()}</p>
                  <p className="text-xs text-amber-500 mt-1">
                    {nombreAnnonces} annonce{nombreAnnonces > 1 ? "s" : ""}{" "}
                    correspondent actuellement
                  </p>
                </div>

                {/* Alertes existantes */}
                {alertes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vos alertes actives ({alertes.length})
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {alertes.map((a) => {
                        const parts: string[] = [];
                        if (a.filtres.typeOffre) parts.push(a.filtres.typeOffre);
                        if (a.filtres.typeBien) parts.push(a.filtres.typeBien);
                        if (a.filtres.prixMax)
                          parts.push(
                            `max ${a.filtres.prixMax.toLocaleString()} FCFA`
                          );
                        if (a.zone)
                          parts.push(`${a.zone.rayonKm}km de ${a.zone.label}`);
                        const label =
                          parts.length > 0
                            ? parts.join(" · ")
                            : "Toutes les annonces";

                        return (
                          <div
                            key={a.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                              alerteExistante?.id === a.id
                                ? "bg-amber-50 border border-amber-200"
                                : "bg-gray-50"
                            }`}
                          >
                            <span className="text-gray-600 truncate mr-2">
                              🔔 {label}
                            </span>
                            <button
                              onClick={() => handleSupprimer(a.id)}
                              disabled={suppressionPending}
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50"
                              aria-label="Supprimer l'alerte"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setOuvert(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Fermer
                  </button>
                  {!alerteExistante && (
                    <button
                      onClick={handleCreer}
                      disabled={creationPending}
                      className="flex-1 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {creationPending ? "Création..." : "🔔 Créer l'alerte"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}