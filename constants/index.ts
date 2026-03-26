export const API_ROUTES = {
  annonces: "/annonces",
  annonce: (id: string) => `/annonces/${id}`,
  utilisateurs: "/utilisateurs",
  utilisateur: (id: string) => `/utilisateurs/${id}`,
  favoris: "/favoris",
  messages: "/messages",
  transactionsCredits: "/transactions_credits",
} as const;

export const TYPES_BIEN: TypeBienOption[] = [
  { label: "Villa", value: "Villa" },
  { label: "Maison", value: "Maison" },
  { label: "Appartement", value: "Appartement" },
  { label: "Studio", value: "Studio" },
  { label: "Bureau", value: "Bureau" },
  { label: "Terrain", value: "Terrain" },
];

export const PERIODES_LABELS: Record<number, string> = {
  1: "/ jour",
  7: "/ semaine",
  30: "/ mois",
  90: "/ trimestre",
  180: "/ semestre",
  365: "/ an",
};

export function formatPeriode(jours: number): string {
  return PERIODES_LABELS[jours] ?? `/ ${jours} jours`;
}

export function formatPrix(montant: number): string {
  return new Intl.NumberFormat("fr-TG", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(montant);
}

interface TypeBienOption {
  label: string;
  value: string;
}