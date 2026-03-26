import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants";
import type { Annonce } from "@/types";

// Récupère toutes les annonces
export function useAnnonces() {
  return useQuery({
    queryKey: ["annonces"],
    queryFn: async (): Promise<Annonce[]> => {
      const { data } = await api.get<Annonce[]>(API_ROUTES.annonces);
      return data;
    },
  });
}

// Récupère une annonce par ID
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