import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants";
import type { Annonce } from "@/types";

/** Liste publique — uniquement les annonces actives */
export function useAnnonces() {
  return useQuery({
    queryKey: ["annonces"],
    queryFn: async (): Promise<Annonce[]> => {
      const { data } = await api.get<Annonce[]>(
        `${API_ROUTES.annonces}?statutAnnonce=Active`
      );
      return data;
    },
  });
}

/** Détail d'une annonce (pas de filtre statut — l'agent doit pouvoir voir ses archivées) */
export function useAnnonce(id: string) {
  return useQuery({
    queryKey: ["annonces", id],
    queryFn: async (): Promise<Annonce> => {
      const { data } = await api.get<Annonce>(API_ROUTES.annonce(id));
      return data;
    },
    enabled: !!id,
  });
}

/** Toutes les annonces d'un agent (tous statuts — pour le dashboard) */
export function useAnnoncesAgent(auteurId: string) {
  return useQuery({
    queryKey: ["annonces", "agent", auteurId],
    queryFn: async (): Promise<Annonce[]> => {
      const { data } = await api.get<Annonce[]>(
        `${API_ROUTES.annonces}?auteurId=${auteurId}`
      );
      return data;
    },
    enabled: !!auteurId,
  });
}