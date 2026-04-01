import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants";
import type { Annonce } from "@/types";

export function useAnnonces() {
  return useQuery({
    queryKey: ["annonces"],
    queryFn: async (): Promise<Annonce[]> => {
      const { data } = await api.get<Annonce[]>(API_ROUTES.annonces);
      return data;
    },
  });
}

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

// Annonces d'un agent spécifique
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