"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuthContext } from "@/lib/AuthContext";
import api from "@/lib/api";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useState } from "react";

const registerSchema = z
  .object({
    nom: z.string().min(2, "Nom trop court"),
    email: z.string().email("Email invalide"),
    telephone: z.string().min(8, "Numéro de téléphone invalide"),
    typeUtilisateur: z.enum(["Client", "Agent", "Agence"]),
    motDePasse: z.string().min(6, "Minimum 6 caractères"),
    confirmerMotDePasse: z.string(),
  })
  .refine((data) => data.motDePasse === data.confirmerMotDePasse, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmerMotDePasse"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargementGoogle, setChargementGoogle] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { typeUtilisateur: "Client" },
  });

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setChargementGoogle(true);
    setErreur(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setErreur("Erreur lors de la connexion avec Google.");
      setChargementGoogle(false);
    }
  };

  // ── Inscription classique ───────────────────────────────────────────────────
  const onSubmit = async (data: RegisterFormData) => {
    setErreur(null);
    try {
      const { data: existing } = await api.get(
        `/utilisateurs?email=${encodeURIComponent(data.email)}`
      );
      if (existing.length > 0) {
        setErreur("Un compte existe déjà avec cet email.");
        return;
      }

      const { data: nouvelUtilisateur } = await api.post("/utilisateurs", {
        id: `u${Date.now()}`,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone,
        typeUtilisateur: data.typeUtilisateur,
        estVerifie: false,
        soldeCredits: 10,
        abonne: false,
        dateInscription: new Date().toISOString(),
      });

      const token = btoa(
        JSON.stringify({
          id: nouvelUtilisateur.id,
          exp: Date.now() + 86_400_000,
        })
      );
      login(nouvelUtilisateur, token);
      router.push("/dashboard");
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-semibold text-emerald-600">
              Tepenye
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 mt-4 mb-1">
              Créer un compte
            </h1>
            <p className="text-sm text-gray-500">
              Rejoignez Tepenye gratuitement
            </p>
          </div>

          {/* ── Bouton Google ─────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={chargementGoogle}
            className="w-full py-3 flex items-center justify-center gap-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors mb-6"
          >
            {chargementGoogle ? (
              <span className="text-sm">Redirection...</span>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z"
                  />
                </svg>
                <span className="text-sm">S'inscrire avec Google</span>
              </>
            )}
          </button>

          {/* Séparateur */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou avec un email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ── Formulaire classique ───────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Nom complet" error={errors.nom?.message} required>
              <Input
                {...register("nom")}
                placeholder="Votre nom"
                error={!!errors.nom}
              />
            </FormField>

            <FormField label="Email" error={errors.email?.message} required>
              <Input
                {...register("email")}
                type="email"
                placeholder="vous@exemple.com"
                error={!!errors.email}
              />
            </FormField>

            <FormField
              label="Téléphone"
              error={errors.telephone?.message}
              required
            >
              <Input
                {...register("telephone")}
                placeholder="+228 90 XX XX XX"
                error={!!errors.telephone}
              />
            </FormField>

            <FormField
              label="Type de compte"
              error={errors.typeUtilisateur?.message}
              required
            >
              <Controller
                name="typeUtilisateur"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      {
                        label: "Client — je cherche un bien",
                        value: "Client",
                      },
                      {
                        label: "Agent — je publie des annonces",
                        value: "Agent",
                      },
                      {
                        label: "Agence — je gère une équipe",
                        value: "Agence",
                      },
                    ]}
                    error={!!errors.typeUtilisateur}
                  />
                )}
              />
            </FormField>

            <FormField
              label="Mot de passe"
              error={errors.motDePasse?.message}
              required
            >
              <Input
                {...register("motDePasse")}
                type="password"
                placeholder="Minimum 6 caractères"
                error={!!errors.motDePasse}
              />
            </FormField>

            <FormField
              label="Confirmer le mot de passe"
              error={errors.confirmerMotDePasse?.message}
              required
            >
              <Input
                {...register("confirmerMotDePasse")}
                type="password"
                placeholder="Répétez le mot de passe"
                error={!!errors.confirmerMotDePasse}
              />
            </FormField>

            {erreur && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-sm text-red-600">{erreur}</p>
              </div>
            )}

            {/* Bonus crédits */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <p className="text-xs text-emerald-700">
                🎁 10 crédits offerts à l'inscription pour découvrir la
                plateforme
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-emerald-600 hover:underline font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}