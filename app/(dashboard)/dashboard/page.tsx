"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthContext } from "@/lib/AuthContext";
import { useAnnoncesAgent } from "@/hooks/useAnnonces";
import {
  useArchiverAnnonce,
  useMarquerPrise,
  useSupprimerAnnonce,
  useReactiverAnnonce,
  useSyncExpirations,
  appliquerExpirationAuto,
} from "@/hooks/useAnnoncesActions";
import ModalEditionAnnonce from "@/components/annonces/ModalEditionAnnonce";
import ModalConfirmationAction from "@/components/annonces/ModalConfirmation";
import { formatPrix, formatPeriode, formatDate } from "@/lib/utils";
import type { Annonce } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Onglet = "actives" | "expirees" | "archivees" | "prises";

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "actives", label: "Actives" },
  { id: "expirees", label: "Expirées" },
  { id: "archivees", label: "Archivées" },
  { id: "prises", label: "Prises / Vendues" },
];

// ─── Config des confirmations ─────────────────────────────────────────────────

type ActionStatut =
  | "prise"
  | "archiver"
  | "reactiver"
  | "liberer"
  | "supprimer";

interface ConfigConfirmation {
  titre: string;
  description: string;
  labelConfirmer: string;
  variante: "danger" | "warning" | "success" | "primary";
}

const CONFIGS: Record<ActionStatut, ConfigConfirmation> = {
  prise: {
    titre: "Marquer le bien comme pris ?",
    description:
      "L'annonce sera masquée du côté public. Vous pourrez la libérer plus tard si le bien se retrouve disponible.",
    labelConfirmer: "Oui, bien pris ✓",
    variante: "primary",
  },
  archiver: {
    titre: "Archiver cette annonce ?",
    description:
      "L'annonce sera masquée du côté public mais conservée dans votre historique. Vous pouvez la réactiver à tout moment.",
    labelConfirmer: "Archiver",
    variante: "warning",
  },
  reactiver: {
    titre: "Réactiver cette annonce ?",
    description:
      "L'annonce sera remise en ligne pour 14 jours supplémentaires et redeviendra visible publiquement.",
    labelConfirmer: "Réactiver (+14j)",
    variante: "success",
  },
  liberer: {
    titre: "Libérer ce bien ?",
    description:
      "Le bien était marqué comme pris. En le libérant, l'annonce sera remise en ligne pour 14 jours et redeviendra visible publiquement.",
    labelConfirmer: "Libérer le bien",
    variante: "success",
  },
  supprimer: {
    titre: "Supprimer définitivement ?",
    description:
      "Cette action est irréversible. L'annonce et toutes ses données seront supprimées définitivement.",
    labelConfirmer: "Supprimer",
    variante: "danger",
  },
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { bg: string; label: string }> = {
    Active: { bg: "bg-emerald-100 text-emerald-700", label: "Active" },
    Expiree: { bg: "bg-gray-100 text-gray-500", label: "Expirée" },
    Brouillon: { bg: "bg-amber-100 text-amber-700", label: "Brouillon" },
    EnCoursValidation: { bg: "bg-blue-100 text-blue-700", label: "En validation" },
    Archivee: { bg: "bg-orange-100 text-orange-700", label: "Archivée" },
    Prise: { bg: "bg-purple-100 text-purple-700", label: "Prise / Vendue" },
  };
  const c = config[statut] ?? { bg: "bg-gray-100 text-gray-500", label: statut };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.bg}`}>
      {c.label}
    </span>
  );
}

// ─── Ligne annonce ────────────────────────────────────────────────────────────

function AnnonceRow({
  annonce,
  auteurId,
  onModifier,
}: {
  annonce: Annonce;
  auteurId: string;
  onModifier: (a: Annonce) => void;
}) {
  const [actionEnCours, setActionEnCours] = useState<ActionStatut | null>(null);

  const { archiver, isPending: archivePending } = useArchiverAnnonce(auteurId);
  const { marquerPrise, isPending: prisePending } = useMarquerPrise(auteurId);
  const { mutate: supprimer, isPending: supprimePending } = useSupprimerAnnonce(auteurId);
  const { mutate: reactiver, isPending: reactivePending } = useReactiverAnnonce(auteurId);

  const photo = annonce.medias?.[0]?.url;
  const joursRestants = Math.max(
    0,
    Math.ceil(
      (new Date(annonce.dateExpiration).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const estActive = annonce.statutAnnonce === "Active";
  const estExpiree = annonce.statutAnnonce === "Expiree";
  const estArchivee = annonce.statutAnnonce === "Archivee";
  const estPrise = annonce.statutAnnonce === "Prise";
  const peutModifier = estActive || annonce.statutAnnonce === "Brouillon";

  const isPending =
    archivePending || prisePending || supprimePending || reactivePending;

  const handleConfirmer = () => {
    if (!actionEnCours) return;
    switch (actionEnCours) {
      case "prise":
        marquerPrise(annonce.id);
        break;
      case "archiver":
        archiver(annonce.id);
        break;
      case "reactiver":
      case "liberer":
        reactiver(annonce.id);
        break;
      case "supprimer":
        supprimer(annonce.id);
        break;
    }
    setActionEnCours(null);
  };

  return (
    <>
      {/* Modal confirmation */}
      {actionEnCours && (
        <ModalConfirmationAction
          {...CONFIGS[actionEnCours]}
          isPending={isPending}
          onConfirmer={handleConfirmer}
          onAnnuler={() => setActionEnCours(null)}
        />
      )}

      <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors rounded-xl">
        {/* Photo */}
        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {photo && (
            <Image
              src={photo}
              alt={annonce.titre}
              fill
              className="object-cover"
              sizes="64px"
            />
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              href={`/annonces/${annonce.id}`}
              className="text-sm font-medium text-gray-900 hover:text-emerald-600 truncate transition-colors"
            >
              {annonce.titre}
            </Link>
            <StatutBadge statut={annonce.statutAnnonce} />
          </div>
          <p className="text-xs text-gray-500 mb-1.5">
            {formatPrix(annonce.prix)}{" "}
            {formatPeriode(annonce.periodePaiementJours)} · {annonce.quartier}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <span>👁 {annonce.statistiques.nombreVues}</span>
            <span>♡ {annonce.statistiques.nombreFavoris}</span>
            <span>💬 {annonce.statistiques.nombreClicsContact}</span>
            {estActive && joursRestants <= 3 && (
              <span className="text-amber-500 font-medium">
                ⚠ Expire dans {joursRestants}j
              </span>
            )}
            {(estExpiree || estArchivee) && (
              <span className="text-gray-400">
                Expiré le {formatDate(annonce.dateExpiration)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
          {/* Modifier */}
          {peutModifier && (
            <button
              onClick={() => onModifier(annonce)}
              className="text-xs text-gray-600 hover:text-emerald-600 px-2.5 py-1 border border-gray-200 rounded-lg transition-colors"
            >
              Modifier
            </button>
          )}

          {/* Bien pris — actives uniquement */}
          {estActive && (
            <button
              onClick={() => setActionEnCours("prise")}
              className="text-xs text-purple-600 hover:bg-purple-50 px-2.5 py-1 border border-purple-200 rounded-lg transition-colors"
            >
              Bien pris ✓
            </button>
          )}

          {/* Libérer — prises uniquement */}
          {estPrise && (
            <button
              onClick={() => setActionEnCours("liberer")}
              className="text-xs text-emerald-600 hover:bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-lg transition-colors"
            >
              Libérer le bien
            </button>
          )}

          {/* Archiver — actives et expirées */}
          {(estActive || estExpiree) && (
            <button
              onClick={() => setActionEnCours("archiver")}
              className="text-xs text-orange-600 hover:bg-orange-50 px-2.5 py-1 border border-orange-200 rounded-lg transition-colors"
            >
              Archiver
            </button>
          )}

          {/* Réactiver — expirées et archivées */}
          {(estExpiree || estArchivee) && (
            <button
              onClick={() => setActionEnCours("reactiver")}
              className="text-xs text-emerald-600 hover:bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-lg transition-colors"
            >
              Réactiver (+14j)
            </button>
          )}

          {/* Supprimer — toutes sauf actives */}
          {!estActive && (
            <button
              onClick={() => setActionEnCours("supprimer")}
              className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1 border border-red-200 rounded-lg transition-colors"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { estConnecte, utilisateur } = useAuthContext();
  const { data: annoncesRaw, isLoading } = useAnnoncesAgent(utilisateur?.id ?? "");
  const { mutate: syncExpirations } = useSyncExpirations(utilisateur?.id ?? "");

  const [onglet, setOnglet] = useState<Onglet>("actives");
  const [annonceEnEdition, setAnnonceEnEdition] = useState<Annonce | null>(null);

  useEffect(() => {
    if (!estConnecte) router.push("/login");
  }, [estConnecte, router]);

  // Expiration automatique au chargement
  useEffect(() => {
    if (!annoncesRaw || annoncesRaw.length === 0) return;
    const { aExpirer } = appliquerExpirationAuto(annoncesRaw);
    if (aExpirer.length > 0) syncExpirations(aExpirer);
  }, [annoncesRaw, syncExpirations]);

  if (!estConnecte || !utilisateur) return null;

  const annonces = annoncesRaw
    ? appliquerExpirationAuto(annoncesRaw).annonces
    : [];

  const actives = annonces.filter((a) => a.statutAnnonce === "Active");
  const expirees = annonces.filter((a) => a.statutAnnonce === "Expiree");
  const archivees = annonces.filter((a) => a.statutAnnonce === "Archivee");
  const prises = annonces.filter((a) => a.statutAnnonce === "Prise");

  const totalVues = annonces.reduce((acc, a) => acc + a.statistiques.nombreVues, 0);
  const totalContacts = annonces.reduce(
    (acc, a) => acc + a.statistiques.nombreClicsContact,
    0
  );

  const annoncesOnglet: Record<Onglet, Annonce[]> = {
    actives,
    expirees,
    archivees,
    prises,
  };

  const limiteAtteinte = actives.length >= 4 && !utilisateur.abonne;

  return (
    <>
      {annonceEnEdition && (
        <ModalEditionAnnonce
          annonce={annonceEnEdition}
          onFermer={() => setAnnonceEnEdition(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Bonjour, {utilisateur.nom.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {utilisateur.typeUtilisateur} · {utilisateur.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/profil"
              className="text-sm px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Mon profil
            </Link>
            {limiteAtteinte ? (
              <button
                disabled
                title="Limite de 4 annonces actives atteinte"
                className="text-sm bg-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
              >
                + Nouvelle annonce
              </button>
            ) : (
              <Link
                href="/publier"
                className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                + Nouvelle annonce
              </Link>
            )}
          </div>
        </div>

        {/* Alerte limite */}
        {limiteAtteinte && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Limite de 4 annonces actives atteinte
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Archivez ou marquez un bien comme pris pour libérer une place, ou passez à un abonnement payant.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Annonces actives"
            value={actives.length}
            sub={utilisateur.abonne ? "Illimitées" : "/ 4 gratuites"}
          />
          <StatCard
            label="Total vues"
            value={totalVues.toLocaleString()}
            sub="Toutes annonces"
          />
          <StatCard
            label="Contacts reçus"
            value={totalContacts}
            sub="Numéros révélés"
          />
          <StatCard
            label="Crédits"
            value={utilisateur.soldeCredits}
            sub={utilisateur.abonne ? "Abonné ✓" : "Compte gratuit"}
          />
        </div>

        {/* Annonces par onglet */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Onglets */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {ONGLETS.map((o) => {
              const count = annoncesOnglet[o.id].length;
              return (
                <button
                  key={o.id}
                  onClick={() => setOnglet(o.id)}
                  className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    onglet === o.id
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {o.label}
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        onglet === o.id
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Contenu */}
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : annoncesOnglet[onglet].length > 0 ? (
            <div className="divide-y divide-gray-50 px-2">
              {annoncesOnglet[onglet].map((annonce) => (
                <AnnonceRow
                  key={annonce.id}
                  annonce={annonce}
                  auteurId={utilisateur.id}
                  onModifier={setAnnonceEnEdition}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <p className="text-gray-400 text-sm">
                {onglet === "actives" && "Aucune annonce active."}
                {onglet === "expirees" && "Aucune annonce expirée."}
                {onglet === "archivees" && "Aucune annonce archivée."}
                {onglet === "prises" && "Aucun bien marqué comme pris ou vendu."}
              </p>
              {onglet === "actives" && (
                <Link
                  href="/publier"
                  className="mt-3 inline-block text-sm text-emerald-600 hover:underline"
                >
                  Publier ma première annonce →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Crédits */}
        {!utilisateur.abonne && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {utilisateur.soldeCredits} crédit
              {utilisateur.soldeCredits !== 1 ? "s" : ""} disponible
              {utilisateur.soldeCredits !== 1 ? "s" : ""}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Chaque fois qu&apos;un client révèle votre numéro, 1 crédit est débité.
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { pack: "Starter", prix: "1 000", credits: 10 },
                { pack: "Standard", prix: "3 000", credits: 35 },
                { pack: "Pro", prix: "5 000", credits: 70 },
              ].map((p) => (
                <button
                  key={p.pack}
                  className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs hover:border-emerald-400 transition-colors"
                >
                  <span className="font-medium text-gray-900">{p.pack}</span>
                  <span className="text-gray-400 ml-1">
                    — {p.credits} crédits / {p.prix} FCFA
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}