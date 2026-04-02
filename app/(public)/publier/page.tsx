"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  annonceSchema,
  type AnnonceFormData,
  TYPES_BIEN_OPTIONS,
  PERIODES_OPTIONS,
} from "@/lib/schemas/annonce.schema";
import { useAuthContext } from "@/lib/AuthContext";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PhotoUpload from "@/components/annonces/PhotoUpload";
import api from "@/lib/api";

const LocalisationPicker = dynamic(
  () => import("@/components/annonces/LocalisationPicker"),
  { ssr: false }
);

type Section = "infos" | "prix" | "localisation" | "gps" | "caracteristiques" | "photos";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "infos", label: "Infos", icon: "📝" },
  { id: "prix", label: "Prix", icon: "💰" },
  { id: "localisation", label: "Adresse", icon: "📍" },
  { id: "gps", label: "GPS", icon: "🗺️" },
  { id: "caracteristiques", label: "Détails", icon: "🏠" },
  { id: "photos", label: "Photos", icon: "📷" },
];

const DERNIERE_SECTION = SECTIONS[SECTIONS.length - 1].id;

export default function PublierPage() {
  const [sectionActive, setSectionActive] = useState<Section>("infos");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { utilisateur } = useAuthContext();

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors, isValid },
  } = useForm<AnnonceFormData>({
    resolver: zodResolver(annonceSchema),
    mode: "onChange",
    defaultValues: {
      // Valeurs par défaut explicites — reconnues comme valides dès le départ
      typeOffre: "Location",
      typeBien: "Villa",
      periodePaiementJours: 30,
      estMeuble: false,
      aClimatisation: false,
      aGarage: false,
      masquerTelephone: false,
      montantAvance: 0,
      montantCaution: 0,
      nombrePieces: 1,
      nombreSanitaires: 1,
      photos: [],
    },
  });

  // watch() est réactif — contrairement à getValues() qui est un snapshot
  const watchedValues = watch();
  const typeOffre = watchedValues.typeOffre;
  const lat = watchedValues.latitude;
  const lng = watchedValues.longitude;

  const indexActuel = SECTIONS.findIndex((s) => s.id === sectionActive);
  const estDerniereSection = sectionActive === DERNIERE_SECTION;

  const allerSection = (direction: "avant" | "apres") => {
    const nouvelIndex = direction === "apres" ? indexActuel + 1 : indexActuel - 1;
    if (nouvelIndex >= 0 && nouvelIndex < SECTIONS.length) {
      setSectionActive(SECTIONS[nouvelIndex].id);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: AnnonceFormData) => {
      const photoUrls = data.photos.map((_, index) => ({
        id: `m${Date.now()}-${index}`,
        url: `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800`,
        typeMedia: "image" as const,
        ordreAffichage: index + 1,
      }));

      const nouvelleAnnonce = {
        id: String(Date.now()),
        titre: data.titre,
        description: data.description,
        prix: data.prix,
        periodePaiementJours: data.periodePaiementJours,
        prixMensuelNormalise: data.prix * (30 / data.periodePaiementJours),
        montantAvance: data.montantAvance,
        montantCaution: data.montantCaution,
        typeBien: data.typeBien,
        typeOffre: data.typeOffre,
        statutAnnonce: "Active",
        adresse: data.adresse,
        quartier: data.quartier,
        localisation: { lat: data.latitude, lng: data.longitude },
        nombrePieces: data.nombrePieces,
        nombreSanitaires: data.nombreSanitaires,
        estMeuble: data.estMeuble,
        aClimatisation: data.aClimatisation,
        aGarage: data.aGarage,
        etage: data.etage ?? null,
        masquerTelephone: data.masquerTelephone,
        datePublication: new Date().toISOString(),
        dateExpiration: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        // Auteur = utilisateur connecté, jamais hardcodé
        auteurId: utilisateur?.id ?? "",
        medias: photoUrls,
        statistiques: {
          nombreVues: 0,
          nombreFavoris: 0,
          nombreClicsContact: 0,
        },
      };

      const { data: created } = await api.post("/annonces", nouvelleAnnonce);
      return created;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["annonces"] });
      queryClient.invalidateQueries({
        queryKey: ["annonces", "agent", utilisateur?.id],
      });
      router.push(`/annonces/${data.id}`);
    },
  });

  const onSubmit = (data: AnnonceFormData) => {
    mutation.mutate(data);
  };

  // ── sectionEstComplete ────────────────────────────────────────────────────
  // Utilise watchedValues (réactif) plutôt que getValues() (snapshot)
  // pour que les selects avec defaultValues soient reconnus comme valides
  const sectionEstComplete = (id: Section): boolean => {
    switch (id) {
      case "infos":
        return (
          !errors.titre &&
          !errors.description &&
          !errors.typeBien &&
          !errors.typeOffre &&
          !!watchedValues.titre &&
          watchedValues.titre.length >= 10 &&
          !!watchedValues.description &&
          watchedValues.description.length >= 30 &&
          // typeBien et typeOffre ont des defaultValues → toujours définis
          !!watchedValues.typeBien &&
          !!watchedValues.typeOffre
        );
      case "prix":
        return (
          !errors.prix &&
          !errors.periodePaiementJours &&
          !!watchedValues.prix &&
          watchedValues.prix > 0 &&
          !!watchedValues.periodePaiementJours &&
          watchedValues.periodePaiementJours > 0
        );
      case "localisation":
        return (
          !errors.adresse &&
          !errors.quartier &&
          !!watchedValues.adresse &&
          watchedValues.adresse.length >= 5 &&
          !!watchedValues.quartier &&
          watchedValues.quartier.length >= 2
        );
      case "gps":
        return (
          !errors.latitude &&
          !errors.longitude &&
          !!watchedValues.latitude &&
          !!watchedValues.longitude
        );
      case "caracteristiques":
        return (
          !errors.nombrePieces &&
          !errors.nombreSanitaires &&
          (watchedValues.nombrePieces ?? 0) >= 0 &&
          (watchedValues.nombreSanitaires ?? 0) >= 0
        );
      case "photos":
        return (
          !errors.photos &&
          !!watchedValues.photos &&
          watchedValues.photos.length >= 4
        );
      default:
        return false;
    }
  };

  const sectionHasError = (id: Section): boolean => {
    switch (id) {
      case "infos":
        return !!(errors.titre || errors.description || errors.typeBien || errors.typeOffre);
      case "prix":
        return !!(errors.prix || errors.periodePaiementJours);
      case "localisation":
        return !!(errors.adresse || errors.quartier);
      case "gps":
        return !!(errors.latitude || errors.longitude);
      case "caracteristiques":
        return !!(errors.nombrePieces || errors.nombreSanitaires || errors.etage);
      case "photos":
        return !!errors.photos;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Publier une annonce
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Étape {indexActuel + 1} sur {SECTIONS.length} —{" "}
          {SECTIONS[indexActuel].label}
        </p>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{
              width: `${((indexActuel + 1) / SECTIONS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Navigation sections */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setSectionActive(section.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              sectionActive === section.id
                ? "bg-emerald-600 text-white"
                : sectionEstComplete(section.id)
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-white border border-gray-200 text-gray-500 hover:border-emerald-300"
            }`}
          >
            <span>{section.icon}</span>
            {section.label}
            {sectionHasError(section.id) && (
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            )}
            {sectionEstComplete(section.id) && !sectionHasError(section.id) && (
              <span className="text-emerald-500 flex-shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

          {/* ── SECTION INFOS ─────────────────────────────────────────────── */}
          {sectionActive === "infos" && (
            <div className="space-y-5">
              <h2 className="text-base font-medium text-gray-800 pb-2 border-b border-gray-100">
                Informations générales
              </h2>
              <FormField label="Titre de l'annonce" error={errors.titre?.message} required>
                <Input
                  {...register("titre")}
                  placeholder="Ex: Villa 4 pièces à Bè Kpota avec piscine"
                  error={!!errors.titre}
                />
              </FormField>
              <FormField label="Description" error={errors.description?.message} required>
                <textarea
                  {...register("description")}
                  rows={5}
                  placeholder="Décrivez votre bien : état, environnement, points forts..."
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors resize-none ${
                    errors.description
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-emerald-500"
                  }`}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Type de bien" error={errors.typeBien?.message} required>
                  <Controller
                    name="typeBien"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={TYPES_BIEN_OPTIONS}
                        error={!!errors.typeBien}
                      />
                    )}
                  />
                </FormField>
                <FormField label="Type d'offre" error={errors.typeOffre?.message} required>
                  <Controller
                    name="typeOffre"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={[
                          { label: "Location", value: "Location" },
                          { label: "Vente", value: "Vente" },
                        ]}
                        error={!!errors.typeOffre}
                      />
                    )}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* ── SECTION PRIX ──────────────────────────────────────────────── */}
          {sectionActive === "prix" && (
            <div className="space-y-5">
              <h2 className="text-base font-medium text-gray-800 pb-2 border-b border-gray-100">
                Prix et modalités financières
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Prix (FCFA)" error={errors.prix?.message} required>
                  <Input
                    {...register("prix", { valueAsNumber: true })}
                    type="number"
                    placeholder="Ex: 150000"
                    error={!!errors.prix}
                  />
                </FormField>
                <FormField label="Période de paiement" error={errors.periodePaiementJours?.message} required>
                  <Controller
                    name="periodePaiementJours"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        options={
                          typeOffre === "Vente"
                            ? [{ label: "Prix total (Paiement unique)", value: 365 }]
                            : PERIODES_OPTIONS
                        }
                        error={!!errors.periodePaiementJours}
                      />
                    )}
                  />
                </FormField>
              </div>
              {typeOffre === "Location" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Montant avance (FCFA)" error={errors.montantAvance?.message} hint="Avance sur loyer exigée">
                    <Input
                      {...register("montantAvance", { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      error={!!errors.montantAvance}
                    />
                  </FormField>
                  <FormField label="Montant caution (FCFA)" error={errors.montantCaution?.message} hint="Caution remboursable">
                    <Input
                      {...register("montantCaution", { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      error={!!errors.montantCaution}
                    />
                  </FormField>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
                Votre annonce sera active pendant 14 jours. Vous recevrez une notification 48h, 24h et 6h avant expiration.
              </div>
            </div>
          )}

          {/* ── SECTION ADRESSE ───────────────────────────────────────────── */}
          {sectionActive === "localisation" && (
            <div className="space-y-5">
              <h2 className="text-base font-medium text-gray-800 pb-2 border-b border-gray-100">
                Adresse du bien
              </h2>
              <FormField label="Quartier" error={errors.quartier?.message} required>
                <Input
                  {...register("quartier")}
                  placeholder="Ex: Bè Kpota, Tokoin, Adidogomé..."
                  error={!!errors.quartier}
                />
              </FormField>
              <FormField label="Adresse" error={errors.adresse?.message} required hint="L'adresse exacte sera visible uniquement après contact avec vous">
                <Input
                  {...register("adresse")}
                  placeholder="Ex: Rue du Commerce, derrière la pharmacie..."
                  error={!!errors.adresse}
                />
              </FormField>
            </div>
          )}

          {/* ── SECTION GPS ───────────────────────────────────────────────── */}
          {sectionActive === "gps" && (
            <div className="space-y-5">
              <h2 className="text-base font-medium text-gray-800 pb-2 border-b border-gray-100">
                Localisation GPS
              </h2>
              <p className="text-sm text-gray-500">
                Cliquez sur la carte pour positionner précisément votre bien.
              </p>
              <LocalisationPicker
                lat={lat ?? null}
                lng={lng ?? null}
                onChange={(newLat, newLng) => {
                  setValue("latitude", newLat, { shouldValidate: true });
                  setValue("longitude", newLng, { shouldValidate: true });
                }}
                error={errors.latitude?.message || errors.longitude?.message}
              />
            </div>
          )}

          {/* ── SECTION CARACTÉRISTIQUES ──────────────────────────────────── */}
          {sectionActive === "caracteristiques" && (
            <div className="space-y-5">
              <h2 className="text-base font-medium text-gray-800 pb-2 border-b border-gray-100">
                Caractéristiques du bien
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Pièces" error={errors.nombrePieces?.message} required>
                  <Input
                    {...register("nombrePieces", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    max={20}
                    error={!!errors.nombrePieces}
                  />
                </FormField>
                <FormField label="Salles de bain" error={errors.nombreSanitaires?.message} required>
                  <Input
                    {...register("nombreSanitaires", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    max={20}
                    error={!!errors.nombreSanitaires}
                  />
                </FormField>
                <FormField label="Étage" error={errors.etage?.message} hint="Vide si plain-pied">
                  <Input
                    {...register("etage", {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    type="number"
                    min={0}
                    max={50}
                    placeholder="—"
                    error={!!errors.etage}
                  />
                </FormField>
              </div>
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-gray-700">Équipements</p>
                {(
                  [
                    { name: "estMeuble" as const, label: "Meublé" },
                    { name: "aClimatisation" as const, label: "Climatisation" },
                    { name: "aGarage" as const, label: "Garage" },
                    { name: "masquerTelephone" as const, label: "Masquer mon numéro de téléphone" },
                  ] as const
                ).map((option) => (
                  <label key={option.name} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register(option.name)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION PHOTOS ────────────────────────────────────────────── */}
          {sectionActive === "photos" && (
            <div className="space-y-5">
              <h2 className="text-base font-medium text-gray-800 pb-2 border-b border-gray-100">
                Photos du bien
              </h2>
              <Controller
                name="photos"
                control={control}
                render={({ field }) => (
                  <PhotoUpload
                    photos={field.value}
                    onChange={field.onChange}
                    error={errors.photos?.message}
                  />
                )}
              />
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {indexActuel > 0 && (
              <button
                type="button"
                onClick={() => allerSection("avant")}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← Précédent
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {!estDerniereSection && (
              <button
                type="button"
                onClick={() => allerSection("apres")}
                className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Suivant →
              </button>
            )}

            {estDerniereSection && (
              <button
                type="submit"
                disabled={!isValid || mutation.isPending}
                className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isValid
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {mutation.isPending
                  ? "Publication en cours..."
                  : !isValid
                  ? "Formulaire incomplet"
                  : "Publier l'annonce ✓"}
              </button>
            )}
          </div>
        </div>

        {mutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">
              Une erreur est survenue lors de la publication. Veuillez réessayer.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}