"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Annonce } from "@/types";
import { useModifierAnnonce } from "@/hooks/useAnnoncesActions";
import {
    TYPES_BIEN_OPTIONS,
    PERIODES_OPTIONS,
} from "@/lib/schemas/annonce.schema";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

// ─── Schéma (sous-ensemble modifiable — pas les photos ni le GPS) ─────────────

const editionSchema = z.object({
    titre: z.string().min(10, "Minimum 10 caractères").max(100),
    description: z.string().min(30, "Minimum 30 caractères").max(1000),
    typeBien: z.enum([
        "Villa",
        "Maison",
        "Appartement",
        "Studio",
        "Bureau",
        "Terrain",
    ]),
    typeOffre: z.enum(["Location", "Vente"]),
    prix: z.number({ error: "Prix invalide" }).positive(),
    periodePaiementJours: z.number().positive(),
    montantAvance: z.number().min(0),
    montantCaution: z.number().min(0),
    quartier: z.string().min(2),
    adresse: z.string().min(5),
    nombrePieces: z.number().min(0).max(20),
    nombreSanitaires: z.number().min(0).max(20),
    etage: z.number().min(0).max(50).nullable().optional(),
    estMeuble: z.boolean(),
    aClimatisation: z.boolean(),
    aGarage: z.boolean(),
    masquerTelephone: z.boolean(),
});

type EditionFormData = z.infer<typeof editionSchema>;

interface ModalEditionAnnonceProps {
    annonce: Annonce;
    onFermer: () => void;
}

export default function ModalEditionAnnonce({
    annonce,
    onFermer,
}: ModalEditionAnnonceProps) {
    const { mutate: modifier, isPending } = useModifierAnnonce(annonce.auteurId);

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors, isDirty },
    } = useForm<EditionFormData>({
        resolver: zodResolver(editionSchema),
        defaultValues: {
            titre: annonce.titre,
            description: annonce.description,
            typeBien: annonce.typeBien,
            typeOffre: annonce.typeOffre,
            prix: annonce.prix,
            periodePaiementJours: annonce.periodePaiementJours,
            montantAvance: annonce.montantAvance,
            montantCaution: annonce.montantCaution,
            quartier: annonce.quartier,
            adresse: annonce.adresse,
            nombrePieces: annonce.nombrePieces,
            nombreSanitaires: annonce.nombreSanitaires,
            etage: annonce.etage,
            estMeuble: annonce.estMeuble,
            aClimatisation: annonce.aClimatisation,
            aGarage: annonce.aGarage,
            masquerTelephone: annonce.masquerTelephone,
        },
    });

    const typeOffre = watch("typeOffre");

    // Réinitialise si l'annonce change (navigation entre annonces)
    useEffect(() => {
        reset({
            titre: annonce.titre,
            description: annonce.description,
            typeBien: annonce.typeBien,
            typeOffre: annonce.typeOffre,
            prix: annonce.prix,
            periodePaiementJours: annonce.periodePaiementJours,
            montantAvance: annonce.montantAvance,
            montantCaution: annonce.montantCaution,
            quartier: annonce.quartier,
            adresse: annonce.adresse,
            nombrePieces: annonce.nombrePieces,
            nombreSanitaires: annonce.nombreSanitaires,
            etage: annonce.etage,
            estMeuble: annonce.estMeuble,
            aClimatisation: annonce.aClimatisation,
            aGarage: annonce.aGarage,
            masquerTelephone: annonce.masquerTelephone,
        });
    }, [annonce.id, reset]);

    const onSubmit = (data: EditionFormData) => {
        modifier(
            { id: annonce.id, ...data },
            { onSuccess: onFermer }
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4"
            onClick={(e) => e.target === e.currentTarget && onFermer()}
        >
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Modifier l&apos;annonce
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {annonce.titre}
                        </p>
                    </div>
                    <button
                        onClick={onFermer}
                        className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">

                        {/* ── Infos générales ─────────────────────────────────────── */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Informations générales
                            </h3>

                            <FormField label="Titre" error={errors.titre?.message} required>
                                <Input
                                    {...register("titre")}
                                    error={!!errors.titre}
                                />
                            </FormField>

                            <FormField
                                label="Description"
                                error={errors.description?.message}
                                required
                            >
                                <textarea
                                    {...register("description")}
                                    rows={4}
                                    className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors resize-none ${errors.description
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-200 focus:border-emerald-500"
                                        }`}
                                />
                            </FormField>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label="Type de bien"
                                    error={errors.typeBien?.message}
                                    required
                                >
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

                                <FormField
                                    label="Type d'offre"
                                    error={errors.typeOffre?.message}
                                    required
                                >
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

                        {/* ── Prix ────────────────────────────────────────────────── */}
                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                                Prix
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label="Prix (FCFA)"
                                    error={errors.prix?.message}
                                    required
                                >
                                    <Input
                                        {...register("prix", { valueAsNumber: true })}
                                        type="number"
                                        error={!!errors.prix}
                                    />
                                </FormField>

                                <FormField
                                    label="Période"
                                    error={errors.periodePaiementJours?.message}
                                    required
                                >
                                    <Controller
                                        name="periodePaiementJours"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(Number(e.target.value))
                                                }
                                                options={
                                                    typeOffre === "Vente"
                                                        ? [{ label: "Prix total", value: 365 }]
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
                                    <FormField
                                        label="Avance (FCFA)"
                                        error={errors.montantAvance?.message}
                                    >
                                        <Input
                                            {...register("montantAvance", { valueAsNumber: true })}
                                            type="number"
                                            error={!!errors.montantAvance}
                                        />
                                    </FormField>
                                    <FormField
                                        label="Caution (FCFA)"
                                        error={errors.montantCaution?.message}
                                    >
                                        <Input
                                            {...register("montantCaution", { valueAsNumber: true })}
                                            type="number"
                                            error={!!errors.montantCaution}
                                        />
                                    </FormField>
                                </div>
                            )}
                        </div>

                        {/* ── Localisation ────────────────────────────────────────── */}
                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                                Localisation
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label="Quartier"
                                    error={errors.quartier?.message}
                                    required
                                >
                                    <Input
                                        {...register("quartier")}
                                        error={!!errors.quartier}
                                    />
                                </FormField>
                                <FormField
                                    label="Adresse"
                                    error={errors.adresse?.message}
                                    required
                                >
                                    <Input
                                        {...register("adresse")}
                                        error={!!errors.adresse}
                                    />
                                </FormField>
                            </div>
                        </div>

                        {/* ── Caractéristiques ────────────────────────────────────── */}
                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">
                                Caractéristiques
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    label="Pièces"
                                    error={errors.nombrePieces?.message}
                                    required
                                >
                                    <Input
                                        {...register("nombrePieces", { valueAsNumber: true })}
                                        type="number"
                                        min={0}
                                        error={!!errors.nombrePieces}
                                    />
                                </FormField>
                                <FormField
                                    label="Salles de bain"
                                    error={errors.nombreSanitaires?.message}
                                    required
                                >
                                    <Input
                                        {...register("nombreSanitaires", { valueAsNumber: true })}
                                        type="number"
                                        min={0}
                                        error={!!errors.nombreSanitaires}
                                    />
                                </FormField>
                                <FormField label="Étage" error={errors.etage?.message}>
                                    <Input
                                        {...register("etage", {
                                            setValueAs: (v) => (v === "" ? null : Number(v)),
                                        })}
                                        type="number"
                                        min={0}
                                        placeholder="—"
                                        error={!!errors.etage}
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {(
                                    [
                                        { name: "estMeuble" as const, label: "Meublé" },
                                        { name: "aClimatisation" as const, label: "Climatisation" },
                                        { name: "aGarage" as const, label: "Garage" },
                                        {
                                            name: "masquerTelephone" as const,
                                            label: "Masquer mon numéro",
                                        },
                                    ] as const
                                ).map((opt) => (
                                    <label
                                        key={opt.name}
                                        className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                                    >
                                        <input
                                            type="checkbox"
                                            {...register(opt.name)}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600"
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onFermer}
                            className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !isDirty}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${isDirty && !isPending
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}