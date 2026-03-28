import { z } from "zod";

export const annonceSchema = z.object({
  titre: z
    .string()
    .min(10, "Le titre doit contenir au moins 10 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères"),

  description: z
    .string()
    .min(30, "La description doit contenir au moins 30 caractères")
    .max(1000, "La description ne peut pas dépasser 1000 caractères"),

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

  adresse: z.string().min(5, "Veuillez entrer une adresse valide"),

  quartier: z.string().min(2, "Veuillez entrer un quartier valide"),

  // Coordonnées GPS — obligatoires
  latitude: z
    .number({ error: "Veuillez placer le marqueur sur la carte" })
    .min(-90).max(90),

  longitude: z
    .number({ error: "Veuillez placer le marqueur sur la carte" })
    .min(-180).max(180),

  nombrePieces: z
    .number({ error: "Valeur invalide" })
    .min(0).max(20),

  nombreSanitaires: z
    .number({ error: "Valeur invalide" })
    .min(0).max(20),

  etage: z
    .number({ error: "Valeur invalide" })
    .min(0).max(50)
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