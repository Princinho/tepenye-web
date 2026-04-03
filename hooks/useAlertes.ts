import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { FiltresAnnonce } from "@/types";
import type { ZoneRecherche } from "@/hooks/useAnnoncesFilters";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Alerte {
  id: string;
  utilisateurId: string;
  filtres: FiltresAnnonce;
  zone: ZoneRecherche | null;
  dateCreation: string;
  active: boolean;
}

const ROUTE = "/alertes";

// ─── Lecture ──────────────────────────────────────────────────────────────────

export function useAlertes(utilisateurId: string | undefined) {
  return useQuery({
    queryKey: ["alertes", utilisateurId],
    enabled: !!utilisateurId,
    queryFn: async (): Promise<Alerte[]> => {
      const { data } = await api.get<Alerte[]>(
        `${ROUTE}?utilisateurId=${utilisateurId}&active=true`
      );
      return data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreerAlerte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      utilisateurId,
      filtres,
      zone,
    }: {
      utilisateurId: string;
      filtres: FiltresAnnonce;
      zone: ZoneRecherche | null;
    }): Promise<Alerte> => {
      const { data } = await api.post<Alerte>(ROUTE, {
        id: `alerte${Date.now()}`,
        utilisateurId,
        filtres,
        zone,
        dateCreation: new Date().toISOString(),
        active: true,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["alertes", variables.utilisateurId],
      });
    },
  });
}

export function useSupprimerAlerte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alerteId,
    }: {
      alerteId: string;
      utilisateurId: string;
    }) => {
      await api.delete(`${ROUTE}/${alerteId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["alertes", variables.utilisateurId],
      });
    },
  });
}