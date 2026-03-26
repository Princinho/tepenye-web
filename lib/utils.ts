import { PERIODES_LABELS } from "@/constants";

export function formatPrix(montant: number): string {
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
}

export function formatPeriode(jours: number): string {
  return PERIODES_LABELS[jours] ?? `/ ${jours} jours`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}