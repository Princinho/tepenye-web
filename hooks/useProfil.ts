import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants";
import type { Utilisateur } from "@/types";

interface ModifierProfilPayload {
  id: string;
  nom?: string;
  telephone?: string;
  /** URL de l'avatar (en prod: upload vers CDN d'abord) */
  avatarUrl?: string;
}

/**
 * Met à jour le profil utilisateur dans json-server.
 * onSuccess reçoit l'utilisateur mis à jour — le composant appelant
 * doit appeler login() de AuthContext pour synchroniser le localStorage.
 */
export function useModifierProfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...champs
    }: ModifierProfilPayload): Promise<Utilisateur> => {
      const { data } = await api.patch<Utilisateur>(
        API_ROUTES.utilisateur(id),
        champs
      );
      return data;
    },
    onSuccess: (utilisateur) => {
      queryClient.invalidateQueries({
        queryKey: ["utilisateur", utilisateur.id],
      });
    },
  });
}