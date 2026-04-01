import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ROUTES } from "@/constants";
import type { Utilisateur } from "@/types";

// ─── localStorage — cache rapide ──────────────────────────────────────────────

const CLE_STORAGE = "tepenye_numeros_debloques";

function cleDeblocage(utilisateurId: string, annonceId: string): string {
    return `${utilisateurId}::${annonceId}`;
}

export function getNumeroCache(
    utilisateurId: string,
    annonceId: string
): string | null {
    if (typeof window === "undefined") return null;
    try {
        const store = JSON.parse(
            localStorage.getItem(CLE_STORAGE) ?? "{}"
        ) as Record<string, string>;
        return store[cleDeblocage(utilisateurId, annonceId)] ?? null;
    } catch {
        return null;
    }
}

export function sauvegarderCache(
    utilisateurId: string,
    annonceId: string,
    telephone: string
): void {
    try {
        const store = JSON.parse(
            localStorage.getItem(CLE_STORAGE) ?? "{}"
        ) as Record<string, string>;
        store[cleDeblocage(utilisateurId, annonceId)] = telephone;
        localStorage.setItem(CLE_STORAGE, JSON.stringify(store));
    } catch { }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionCredit {
    id: string;
    utilisateurId: string; // agent
    clientId: string;      // client qui a demandé le numéro
    annonceId: string;
    montant: number;
    type: string;
    date: string;
}

// ─── Hook de vérification — source de vérité en base ─────────────────────────

/**
 * Vérifie si le client a déjà débloqué le numéro pour cette annonce.
 * Priorité 1 : localStorage (instantané)
 * Priorité 2 : GET /transactions_credits (fallback si localStorage perdu)
 *
 * Si la transaction existe en base mais pas dans le localStorage,
 * reconstruit automatiquement le cache avec le numéro de l'agent.
 */
export function useNumeroDebloque(
    utilisateurId: string | undefined,
    annonceId: string,
    auteurId: string
) {
    return useQuery({
        queryKey: ["numero-debloque", utilisateurId, annonceId],
        enabled: !!utilisateurId,
        // On garde le résultat 5 min pour éviter des appels répétés
        staleTime: 1000 * 60 * 5,

        queryFn: async (): Promise<string | null> => {
            if (!utilisateurId) return null;

            // Priorité 1 : cache localStorage
            const cached = getNumeroCache(utilisateurId, annonceId);
            if (cached) return cached;

            // Priorité 2 : chercher dans les transactions en base
            const { data: transactions } = await api.get<TransactionCredit[]>(
                `${API_ROUTES.transactionsCredits}?clientId=${utilisateurId}&annonceId=${annonceId}&type=Consommation`
            );

            if (!transactions || transactions.length === 0) return null;

            // Transaction trouvée → récupérer le numéro de l'agent et reconstruire le cache
            const { data: agent } = await api.get<Utilisateur>(
                API_ROUTES.utilisateur(auteurId)
            );
            if (!agent?.telephone) return null;

            sauvegarderCache(utilisateurId, annonceId, agent.telephone);
            return agent.telephone;
        },
    });
}

// ─── Mutation — premier déblocage ─────────────────────────────────────────────

interface VoirNumeroParams {
    auteurId: string;
    annonceId: string;
    utilisateurId: string;
}

interface VoirNumeroResult {
    telephone: string;
    creditsRestants: number;
}

export function useVoirNumero() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            auteurId,
            annonceId,
            utilisateurId,
        }: VoirNumeroParams): Promise<VoirNumeroResult> => {
            // 1. Récupérer l'agent
            const { data: agent } = await api.get<Utilisateur>(
                API_ROUTES.utilisateur(auteurId)
            );
            if (!agent) throw new Error("Agent introuvable.");

            // 2. Vérifier les crédits
            if (agent.soldeCredits <= 0) {
                throw new Error(
                    "L'agent n'a plus de crédits disponibles. Le numéro n'est pas accessible pour le moment."
                );
            }
            //TODO: S'assurer que la decrementation et le logging reussissent tous les deux ou échouent tous les deux (transactionnelle)
            // 3. Décrémenter le solde
            await api.patch(API_ROUTES.utilisateur(auteurId), {
                soldeCredits: agent.soldeCredits - 1,
            });

            // 4. Logger la transaction avec clientId pour retrouvabilité future
            await api.post<TransactionCredit>(API_ROUTES.transactionsCredits, {
                id: `tx${Date.now()}`,
                utilisateurId: auteurId,  // agent dont le crédit est débité
                clientId: utilisateurId,  // client qui a demandé le numéro
                annonceId,
                montant: -1,
                type: "Consommation",
                motif: "Affichage numéro client",
                date: new Date().toISOString(),
            });

            // 5. Mettre en cache localStorage
            sauvegarderCache(utilisateurId, annonceId, agent.telephone);

            return {
                telephone: agent.telephone,
                creditsRestants: agent.soldeCredits - 1,
            };
        },

        onSuccess: (_data, variables) => {
            // Invalide le cache de vérification pour que useNumeroDebloque renvoie le bon résultat
            queryClient.invalidateQueries({
                queryKey: ["numero-debloque", variables.utilisateurId, variables.annonceId],
            });
            queryClient.invalidateQueries({
                queryKey: ["utilisateur", variables.auteurId],
            });
            queryClient.invalidateQueries({ queryKey: ["auth"] });
        },
    });
}