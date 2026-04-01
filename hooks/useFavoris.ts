import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants";
import type { AnnonceFavori } from "@/types";

// ─── Lecture ──────────────────────────────────────────────────────────────────

/** Récupère tous les favoris d'un utilisateur */
export function useFavoris(utilisateurId: string | undefined) {
  return useQuery({
    queryKey: ["favoris", utilisateurId],
    queryFn: async (): Promise<AnnonceFavori[]> => {
      const { data } = await api.get<AnnonceFavori[]>(
        `${API_ROUTES.favoris}?utilisateurId=${utilisateurId}`
      );
      return data;
    },
    enabled: !!utilisateurId,
    staleTime: 1000 * 60 * 2,
  });
}

/** Vérifie si une annonce spécifique est dans les favoris */
export function useEstFavori(
  utilisateurId: string | undefined,
  annonceId: string
) {
  const { data: favoris = [] } = useFavoris(utilisateurId);
  return favoris.some((f) => f.annonceId === annonceId);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useToggleFavori(utilisateurId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      annonceId,
      estFavori,
      favoriId,
    }: {
      annonceId: string;
      estFavori: boolean;
      favoriId?: string;
    }) => {
      if (estFavori && favoriId) {
        // Retrait
        await api.delete(`${API_ROUTES.favoris}/${favoriId}`);
      } else {
        // Ajout
        await api.post<AnnonceFavori>(API_ROUTES.favoris, {
          id: `f${Date.now()}`,
          utilisateurId,
          annonceId,
          dateAjout: new Date().toISOString(),
        });
      }
    },

    // Optimistic update — on met à jour le cache immédiatement
    onMutate: async ({ annonceId, estFavori }) => {
      await queryClient.cancelQueries({
        queryKey: ["favoris", utilisateurId],
      });

      const snapshot = queryClient.getQueryData<AnnonceFavori[]>([
        "favoris",
        utilisateurId,
      ]);

      queryClient.setQueryData<AnnonceFavori[]>(
        ["favoris", utilisateurId],
        (old = []) => {
          if (estFavori) {
            return old.filter((f) => f.annonceId !== annonceId);
          } else {
            return [
              ...old,
              {
                id: `f${Date.now()}`,
                utilisateurId: utilisateurId ?? "",
                annonceId,
                dateAjout: new Date().toISOString(),
              },
            ];
          }
        }
      );

      return { snapshot };
    },

    // Rollback en cas d'erreur
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(
          ["favoris", utilisateurId],
          context.snapshot
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favoris", utilisateurId] });
    },
  });
}