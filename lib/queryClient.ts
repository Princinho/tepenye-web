import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // données fraîches pendant 5 minutes
      gcTime: 1000 * 60 * 10,        // cache gardé 10 minutes
      retry: 1,                       // 1 seule tentative en cas d'erreur
      refetchOnWindowFocus: false,    // pas de refetch au focus fenêtre
    },
  },
});