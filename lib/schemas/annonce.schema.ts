import { z } from "zod";

// ─── Détection de numéros de téléphone ───────────────────────────────────────

const REGEX_TELEPHONE =
  /(\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{0,4}/;

/**
 * Vérifie qu'une séquence de chiffres extraite a au moins 8 chiffres
 * (pour éviter les faux positifs sur des années, superficies, etc.)
 */
function contientNumeroTelephone(valeur: string): boolean {
  const matches = valeur.match(REGEX_TELEPHONE);
  if (!matches) return false;
  // Compte uniquement les chiffres du match — 8+ chiffres = numéro de téléphone
  const chiffres = matches[0].replace(/\D/g, "");
  return chiffres.length >= 8;
}

const MSG_TELEPHONE =
  "Vous ne pouvez pas insérer de numéro de téléphone ici. Utilisez l'option « Voir le numéro » pour que les clients vous contactent.";

/** Raffinement zod réutilisable anti-téléphone */
function sansNumeroTelephone<T extends z.ZodString>(schema: T) {
  return schema.refine(
    (val) => !contientNumeroTelephone(val),
    { message: MSG_TELEPHONE }
  );
}

// ─── Schéma principal ─────────────────────────────────────────────────────────

export const annonceSchema = z.object({
  titre: sansNumeroTelephone(
    z
      .string()
      .min(10, "Le titre doit contenir au moins 10 caractères")
      .max(100, "Le titre ne peut pas dépasser 100 caractères")
  ),

  description: sansNumeroTelephone(
    z
      .string()
      .min(30, "La description doit contenir au moins 30 caractères")
      .max(1000, "La description ne peut pas dépasser 1000 caractères")
  ),

  typeBien: z.enum(
    ["Villa", "Maison", "Appartement", "Studio", "Bureau", "Terrain"],
    { error: "Veuillez sélectionner un type de bien" }
  ),

  typeOffre: z.enum(["Location", "Vente"], {
    error: "Veuillez sélectionner un type d'offre",
  }),

  prix: z
    .number({ error: "Veuillez entrer un prix valide" })
    .positive("Le prix doit être supérieur à 0"),

  periodePaiementJours: z
    .number({ error: "Veuillez sélectionner une période" })
    .positive("La période doit être supérieure à 0"),

  montantAvance: z
    .number({ error: "Montant invalide" })
    .min(0, "Le montant ne peut pas être négatif"),

  montantCaution: z
    .number({ error: "Montant invalide" })
    .min(0, "Le montant ne peut pas être négatif"),

  adresse: sansNumeroTelephone(
    z.string().min(5, "Veuillez entrer une adresse valide")
  ),

  quartier: sansNumeroTelephone(
    z.string().min(2, "Veuillez entrer un quartier valide")
  ),

  latitude: z
    .number({ error: "Veuillez placer le marqueur sur la carte" })
    .min(-90)
    .max(90),

  longitude: z
    .number({ error: "Veuillez placer le marqueur sur la carte" })
    .min(-180)
    .max(180),

  nombrePieces: z.number({ error: "Valeur invalide" }).min(0).max(20),

  nombreSanitaires: z.number({ error: "Valeur invalide" }).min(0).max(20),

  etage: z
    .number({ error: "Valeur invalide" })
    .min(0)
    .max(50)
    .nullable()
    .optional(),

  estMeuble: z.boolean(),
  aClimatisation: z.boolean(),
  aGarage: z.boolean(),
  masquerTelephone: z.boolean(),

  photos: z
    .array(z.instanceof(File))
    .min(4, "Veuillez ajouter au moins 4 photos")
    .max(10, "Vous ne pouvez pas ajouter plus de 10 photos"),
});

export type AnnonceFormData = z.infer<typeof annonceSchema>;

export const TYPES_BIEN_OPTIONS = [
  { label: "Villa", value: "Villa" },
  { label: "Maison", value: "Maison" },
  { label: "Appartement", value: "Appartement" },
  { label: "Studio", value: "Studio" },
  { label: "Bureau", value: "Bureau" },
  { label: "Terrain", value: "Terrain" },
] as const;

export const PERIODES_OPTIONS = [
  { label: "Par jour", value: 1 },
  { label: "Par semaine", value: 7 },
  { label: "Par mois", value: 30 },
  { label: "Par trimestre", value: 90 },
  { label: "Par semestre", value: 180 },
  { label: "Par an", value: 365 },
] as const;