import Link from "next/link";
import Image from "next/image";
import type { Annonce } from "@/types";
import { formatPrix, formatPeriode } from "@/lib/utils";

interface AnnonceCardProps {
  annonce: Annonce;
}

export default function AnnonceCard({ annonce }: AnnonceCardProps) {
  const photoUrl = annonce.medias?.[0]?.url ?? "/placeholder.jpg";

  return (
    <Link href={`/annonces/${annonce.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Photo */}
        <div className="relative h-48 w-full bg-gray-100">
          <Image
            src={photoUrl}
            alt={annonce.titre}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" loading="eager"
          />
          {/* Badge type offre */}
          <span className={`absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-full ${
            annonce.typeOffre === "Location"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-blue-100 text-blue-700"
          }`}>
            {annonce.typeOffre}
          </span>
          {/* Badge type bien */}
          <span className="absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full bg-white/90 text-gray-700">
            {annonce.typeBien}
          </span>
        </div>

        {/* Contenu */}
        <div className="p-4">
          {/* Prix */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrix(annonce.prix)}
            </span>
            <span className="text-sm text-gray-500">
              {formatPeriode(annonce.periodePaiementJours)}
            </span>
          </div>

          {/* Titre */}
          <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-1">
            {annonce.titre}
          </h3>

          {/* Quartier */}
          <p className="text-xs text-gray-500 mb-3">
            📍 {annonce.quartier}
          </p>

          {/* Caractéristiques */}
          <div className="flex items-center gap-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
            {annonce.nombrePieces > 0 && (
              <span>{annonce.nombrePieces} pièce{annonce.nombrePieces > 1 ? "s" : ""}</span>
            )}
            {annonce.nombreSanitaires > 0 && (
              <span>{annonce.nombreSanitaires} sdb</span>
            )}
            {annonce.estMeuble && (
              <span className="text-emerald-600">Meublé</span>
            )}
            {annonce.aClimatisation && (
              <span>❄️ Clim</span>
            )}
            {annonce.aGarage && (
              <span>🚗 Garage</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}