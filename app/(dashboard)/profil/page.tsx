"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/lib/AuthContext";
import { useModifierProfil } from "@/hooks/useProfil";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";

const profilSchema = z.object({
  nom: z.string().min(2, "Minimum 2 caractères").max(60),
  telephone: z
    .string()
    .min(8, "Numéro invalide")
    .regex(/^\+?[\d\s\-()]+$/, "Format invalide"),
});

type ProfilFormData = z.infer<typeof profilSchema>;

const TYPE_LABELS: Record<string, string> = {
  Client: "Chercheur de bien",
  Agent: "Agent immobilier",
  Agence: "Agence immobilière",
};

export default function ProfilPage() {
  const router = useRouter();
  const { utilisateur, estConnecte, login } = useAuthContext();
  const { mutate: modifierProfil, isPending, isSuccess } = useModifierProfil();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfilFormData>({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      nom: utilisateur?.nom ?? "",
      telephone: utilisateur?.telephone ?? "",
    },
  });

  useEffect(() => {
    if (!estConnecte) router.push("/login");
  }, [estConnecte, router]);

  // Pré-remplit si l'utilisateur change (rare mais sécurisé)
  useEffect(() => {
    if (utilisateur) {
      reset({
        nom: utilisateur.nom,
        telephone: utilisateur.telephone,
      });
    }
  }, [utilisateur?.id, reset]);

  if (!estConnecte || !utilisateur) return null;

  const onSubmit = (data: ProfilFormData) => {
    modifierProfil(
      { id: utilisateur.id, ...data },
      {
        onSuccess: (utilisateurMisAJour) => {
          // Sync AuthContext + localStorage avec le profil mis à jour
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("tepenye_token") ?? ""
              : "";
          login(utilisateurMisAJour, token);
          reset({ nom: utilisateurMisAJour.nom, telephone: utilisateurMisAJour.telephone });
        },
      }
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Avatar + identité */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
            {utilisateur.nom.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {utilisateur.nom}
            </p>
            <p className="text-sm text-gray-500">{utilisateur.email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {TYPE_LABELS[utilisateur.typeUtilisateur] ??
                utilisateur.typeUtilisateur}
            </span>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Informations modifiables
          </h2>

          <FormField label="Nom complet" error={errors.nom?.message} required>
            <Input
              {...register("nom")}
              placeholder="Votre nom"
              error={!!errors.nom}
            />
          </FormField>

          <FormField
            label="Numéro de téléphone"
            error={errors.telephone?.message}
            required
          >
            <Input
              {...register("telephone")}
              type="tel"
              placeholder="+228 90 XX XX XX"
              error={!!errors.telephone}
            />
          </FormField>

          {/* Champs en lecture seule */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider pt-1">
              Informations non modifiables
            </h2>

            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1.5">
                Adresse email
              </label>
              <div className="w-full px-3 py-2.5 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400">
                {utilisateur.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                L&apos;email ne peut pas être modifié.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1.5">
                Type de compte
              </label>
              <div className="w-full px-3 py-2.5 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400">
                {TYPE_LABELS[utilisateur.typeUtilisateur] ??
                  utilisateur.typeUtilisateur}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Contactez le support pour changer de type de compte.
              </p>
            </div>
          </div>

          {/* Feedback succès */}
          {isSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
              <p className="text-sm text-emerald-700 font-medium">
                ✓ Profil mis à jour avec succès
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !isDirty}
            className={`w-full py-3 text-sm font-medium rounded-lg transition-colors ${
              isDirty && !isPending
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>

        {/* Infos compte */}
        <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Compte
          </h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Membre depuis</span>
            <span className="text-gray-700">
              {new Intl.DateTimeFormat("fr-FR", {
                month: "long",
                year: "numeric",
              }).format(new Date(utilisateur.dateInscription))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Crédits disponibles</span>
            <span className="text-gray-700 font-medium">
              {utilisateur.soldeCredits}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Abonnement</span>
            <span
              className={
                utilisateur.abonne
                  ? "text-emerald-600 font-medium"
                  : "text-gray-400"
              }
            >
              {utilisateur.abonne ? "Actif ✓" : "Gratuit"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}