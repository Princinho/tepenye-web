import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants";

interface EnvoyerMessageParams {
  annonceId: string;
  expediteurId: string;
  contenu: string;
}

export function useEnvoyerMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      annonceId,
      expediteurId,
      contenu,
    }: EnvoyerMessageParams) => {
      const { data } = await api.post(API_ROUTES.messages, {
        id: `msg${Date.now()}`,
        annonceId,
        expediteurId,
        contenu,
        envoyeLe: new Date().toISOString(),
        estLu: false,
        dateLecture: null,
        supprimeParExpediteur: false,
        supprimeParDestinataire: false,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.annonceId],
      });
    },
  });
}