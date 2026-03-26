"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useAnnonce } from "@/hooks/useAnnonces";
import { formatPrix, formatPeriode, formatDate } from "@/lib/utils";

export default function AnnonceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: annonce, isLoading, isError } = useAnnonce(id);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-96 bg-gray-200 rounded-xl" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (isError || !annonce) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Annonce introuvable.</p>
        <button
          onClick={() => router.back()}
          className="text-emerald-600 hover:underline text-sm"
        >
          ← Retour aux annonces
        </button>
      </div>
    );
  }

  const photos = annonce.medias.filter((m) => m.typeMedia === "image");
  const photoActive = photos[photoIndex]?.url ?? "/placeholder.jpg";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Retour */}
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1 transition-colors"
      >
        ← Retour aux annonces
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Galerie photos */}
          <div className="space-y-3">
            <div className="relative h-80 w-full rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={photoActive}
                alt={annonce.titre}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
              <span className={`absolute top-4 left-4 text-xs font-medium px-3 py-1 rounded-full ${
                annonce.typeOffre === "Location"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {annonce.typeOffre}
              </span>
            </div>

            {/* Miniatures */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setPhotoIndex(index)}
                    className={`relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === photoIndex
                        ? "border-emerald-500"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Titre et prix */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {annonce.titre}
              </h1>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-semibold text-emerald-600">
                  {formatPrix(annonce.prix)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPeriode(annonce.periodePaiementJours)}
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              📍 {annonce.adresse}
            </p>
          </div>

          {/* Caractéristiques */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-4">
              Caractéristiques
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {annonce.nombrePieces > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-semibold text-gray-900">{annonce.nombrePieces}</div>
                  <div className="text-xs text-gray-500 mt-1">Pièce{annonce.nombrePieces > 1 ? "s" : ""}</div>
                </div>
              )}
              {annonce.nombreSanitaires > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-semibold text-gray-900">{annonce.nombreSanitaires}</div>
                  <div className="text-xs text-gray-500 mt-1">Salle{annonce.nombreSanitaires > 1 ? "s" : ""} de bain</div>
                </div>
              )}
              {annonce.etage !== null && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-semibold text-gray-900">{annonce.etage}</div>
                  <div className="text-xs text-gray-500 mt-1">Étage</div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {annonce.estMeuble && (
                <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                  Meublé
                </span>
              )}
              {annonce.aClimatisation && (
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                  Climatisation
                </span>
              )}
              {annonce.aGarage && (
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200">
                  Garage
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-3">
              Description
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {annonce.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-gray-400">
            <span>{annonce.statistiques.nombreVues} vues</span>
            <span>·</span>
            <span>{annonce.statistiques.nombreFavoris} favoris</span>
            <span>·</span>
            <span>Publié le {formatDate(annonce.datePublication)}</span>
          </div>
        </div>

        {/* Sidebar contact */}
        <div className="space-y-4">
          {/* Avance & caution */}
          {(annonce.montantAvance > 0 || annonce.montantCaution > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-4">
                Montants à prévoir
              </h2>
              <div className="space-y-3">
                {annonce.montantAvance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avance</span>
                    <span className="font-medium text-gray-900">
                      {formatPrix(annonce.montantAvance)}
                    </span>
                  </div>
                )}
                {annonce.montantCaution > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Caution</span>
                    <span className="font-medium text-gray-900">
                      {formatPrix(annonce.montantCaution)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Total à avancer</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrix(annonce.montantAvance + annonce.montantCaution)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-4">
              Contacter l'agent
            </h2>
            <button className="w-full bg-emerald-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors mb-3">
              Envoyer un message
            </button>
            {!annonce.masquerTelephone && (
              <button className="w-full border border-gray-200 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Voir le numéro
              </button>
            )}
            <p className="text-xs text-gray-400 text-center mt-3">
              Expiration le {formatDate(annonce.dateExpiration)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}