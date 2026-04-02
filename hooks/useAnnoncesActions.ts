import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants";
import type { Annonce } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatutAnnonce =
  | "Active"
  | "Expiree"
  | "Brouillon"
  | "EnCoursValidation"
  | "Archivee"
  | "Prise";

export interface ModifierAnnoncePayload {
  id: string;
  titre?: string;
  description?: string;
  prix?: number;
  periodePaiementJours?: number;
  montantAvance?: number;
  montantCaution?: number;
  quartier?: string;
  adresse?: string;
  nombrePieces?: number;
  nombreSanitaires?: number;
  estMeuble?: boolean;
  aClimatisation?: boolean;
  aGarage?: boolean;
  etage?: number | null;
  masquerTelephone?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Applique l'expiration automatique côté client :
 * toute annonce Active dont dateExpiration est passée passe à "Expiree".
 * Retourne la liste mise à jour + les IDs à patcher en base.
 */
export function appliquerExpirationAuto(annonces: Annonce[]): {
  annonces: Annonce[];
  aExpirer: string[];
} {
  const now = Date.now();
  const aExpirer: string[] = [];

  const mises = annonces.map((a) => {
    if (
      a.statutAnnonce === "Active" &&
      new Date(a.dateExpiration).getTime() < now
    ) {
      aExpirer.push(a.id);
      return { ...a, statutAnnonce: "Expiree" as StatutAnnonce };
    }
    return a;
  });

  return { annonces: mises, aExpirer };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

function useChangerStatut(auteurId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: StatutAnnonce;
    }) => {
      const { data } = await api.patch<Annonce>(API_ROUTES.annonce(id), {
        statutAnnonce: statut,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annonces"] });
      queryClient.invalidateQueries({
        queryKey: ["annonces", "agent", auteurId],
      });
    },
  });
}

/** Archive une annonce (masquée côté public, conservée en base) */
export function useArchiverAnnonce(auteurId: string) {
  const { mutate, isPending } = useChangerStatut(auteurId);
  return {
    archiver: (id: string) => mutate({ id, statut: "Archivee" }),
    isPending,
  };
}

/** Marque le bien comme pris / loué / vendu */
export function useMarquerPrise(auteurId: string) {
  const { mutate, isPending } = useChangerStatut(auteurId);
  return {
    marquerPrise: (id: string) => mutate({ id, statut: "Prise" }),
    isPending,
  };
}

/** Réactive une annonce archivée ou expirée en prolongeant de 14j */
export function useReactiverAnnonce(auteurId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const nouvelleDateExpiration = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { data } = await api.patch<Annonce>(API_ROUTES.annonce(id), {
        statutAnnonce: "Active",
        dateExpiration: nouvelleDateExpiration,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annonces"] });
      queryClient.invalidateQueries({
        queryKey: ["annonces", "agent", auteurId],
      });
    },
  });
}

/** Supprime définitivement une annonce */
export function useSupprimerAnnonce(auteurId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(API_ROUTES.annonce(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annonces"] });
      queryClient.invalidateQueries({
        queryKey: ["annonces", "agent", auteurId],
      });
    },
  });
}

/** Modifie les champs texte/prix d'une annonce */
export function useModifierAnnonce(auteurId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...champs }: ModifierAnnoncePayload) => {
      // Recalcule le prix mensuel normalisé si prix ou période changent
      const patchData: Partial<Annonce> & Record<string, unknown> = {
        ...champs,
      };
      if (champs.prix && champs.periodePaiementJours) {
        patchData.prixMensuelNormalise =
          champs.prix * (30 / champs.periodePaiementJours);
      }
      const { data } = await api.patch<Annonce>(
        API_ROUTES.annonce(id),
        patchData
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["annonces", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["annonces"] });
      queryClient.invalidateQueries({
        queryKey: ["annonces", "agent", auteurId],
      });
    },
  });
}

/** Patche en base toutes les annonces expirées (appelé au chargement du dashboard) */
export function useSyncExpirations(auteurId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) =>
          api.patch(API_ROUTES.annonce(id), { statutAnnonce: "Expiree" })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["annonces", "agent", auteurId],
      });
    },
  });
}