"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useAuthContext } from "@/lib/AuthContext";
import api from "@/lib/api";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import type { Utilisateur } from "@/types";

// ─── Schémas ──────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email("Email invalide"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});

const telephoneSchema = z.object({
  telephone: z
    .string()
    .min(8, "Numéro invalide")
    .regex(/^\+?[\d\s\-()]+$/, "Format invalide"),
});

const otpSchema = z.object({
  code: z.string().length(4, "Le code doit contenir 4 chiffres"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type TelephoneFormData = z.infer<typeof telephoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type Onglet = "email" | "telephone" | "google";

// ─── Modal OTP démo ───────────────────────────────────────────────────────────

function ModalOtp({
  telephone,
  codeGenere,
  onValider,
  onFermer,
  erreur,
  chargement,
}: {
  telephone: string;
  codeGenere: string;
  onValider: (code: string) => Promise<void>;
  onFermer: () => void;
  erreur: string | null;
  chargement: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onFermer()}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Vérification du numéro
          </h2>
          <p className="text-sm text-gray-500">
            Code envoyé au{" "}
            <span className="font-medium text-gray-700">{telephone}</span>
          </p>
        </div>

        {/* Encadré démo — affiche le code en clair */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-2">
            🔧 Mode démonstration
          </p>
          <p className="text-xs text-amber-500 mb-3">
            En production, ce code serait envoyé par SMS via Twilio.
          </p>
          <div className="text-4xl font-mono font-bold text-amber-700 tracking-widest">
            {codeGenere}
          </div>
        </div>

        <form
          onSubmit={handleSubmit((d) => onValider(d.code))}
          className="space-y-4"
        >
          <FormField
            label="Entrez le code reçu"
            error={errors.code?.message}
            required
          >
            <Input
              {...register("code")}
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              className="text-center text-2xl font-mono tracking-widest"
              error={!!errors.code}
              autoFocus
            />
          </FormField>

          {erreur && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{erreur}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onFermer}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={chargement}
              className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {chargement ? "Vérification..." : "Valider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();

  // On écoute la session next-auth pour détecter l'arrivée d'une connexion Google
  const { data: session, status } = useSession();

  const [onglet, setOnglet] = useState<Onglet>("email");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargementGoogle, setChargementGoogle] = useState(false);

  // OTP
  const [modalOtpOuvert, setModalOtpOuvert] = useState(false);
  const [telephoneEnCours, setTelephoneEnCours] = useState("");
  const [codeOtpGenere, setCodeOtpGenere] = useState("");
  const [erreurOtp, setErreurOtp] = useState<string | null>(null);
  const [chargementOtp, setChargementOtp] = useState(false);

  // ── Redirection automatique après session Google ──────────────────────────
  // useSession() est mis à jour dès que next-auth a fini son callback OAuth.
  // On surveille ici pour rediriger sans attendre un clic supplémentaire.
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    if (session.needsOnboarding) {
      // Nouveau compte Google → choisir le rôle
      router.replace("/onboarding");
    } else {
      // Compte existant → aller au dashboard
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });
  const telephoneForm = useForm<TelephoneFormData>({
    resolver: zodResolver(telephoneSchema),
  });

  // ── Connexion email (json-server) ─────────────────────────────────────────
  const handleEmailSubmit = async (data: EmailFormData) => {
    setErreur(null);
    try {
      const { data: utilisateurs } = await api.get<Utilisateur[]>(
        `/utilisateurs?email=${encodeURIComponent(data.email)}`
      );
      if (!utilisateurs || utilisateurs.length === 0) {
        setErreur("Aucun compte trouvé avec cet email.");
        return;
      }
      const utilisateur = utilisateurs[0];
      const token = btoa(
        JSON.stringify({ id: utilisateur.id, exp: Date.now() + 86_400_000 })
      );
      login(utilisateur, token);
      router.push("/dashboard");
    } catch {
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  // ── Envoi OTP simulé ──────────────────────────────────────────────────────
  const handleTelephoneSubmit = async (data: TelephoneFormData) => {
    setErreur(null);
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setCodeOtpGenere(code);
    setTelephoneEnCours(data.telephone);
    setErreurOtp(null);
    setModalOtpOuvert(true);
  };

  // ── Validation OTP ────────────────────────────────────────────────────────
  const handleValiderOtp = async (codeSaisi: string) => {
    setErreurOtp(null);
    if (codeSaisi !== codeOtpGenere) {
      setErreurOtp("Code incorrect. Vérifiez le code affiché.");
      return;
    }
    setChargementOtp(true);
    try {
      const result = await signIn("otp-telephone", {
        telephone: telephoneEnCours,
        codeValide: "true",
        redirect: false,
      });
      if (result?.error) {
        setErreurOtp("Connexion impossible. Réessayez.");
        return;
      }
      // La session va se mettre à jour → useEffect ci-dessus prend le relai
      setModalOtpOuvert(false);
    } catch {
      setErreurOtp("Une erreur est survenue.");
    } finally {
      setChargementOtp(false);
    }
  };

  // ── Connexion Google ──────────────────────────────────────────────────────
  // On utilise redirect: false pour rester maître de la navigation.
  // Mais Google OAuth nécessite une vraie redirection navigateur vers Google.
  // On passe donc callbackUrl explicitement et on laisse next-auth faire la
  // redirection — le useEffect ci-dessus capte le retour.
  const handleGoogleSignIn = async () => {
    setChargementGoogle(true);
    setErreur(null);
    // callbackUrl = page courante (/login) pour que useSession() se déclenche
    // après le retour OAuth et que notre useEffect gère la suite.
    await signIn("google", { callbackUrl: "/login" });
    // La page est rechargée par Google OAuth — ce qui suit ne s'exécute pas.
  };

  const onglets: { id: Onglet; label: string }[] = [
    { id: "email", label: "Email" },
    { id: "telephone", label: "Téléphone" },
    { id: "google", label: "Google" },
  ];

  // Si la session est en cours de chargement après retour OAuth, on affiche
  // un état de transition pour éviter un flash de la page de connexion.
  if (status === "loading" || (status === "authenticated" && session)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Connexion en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {modalOtpOuvert && (
        <ModalOtp
          telephone={telephoneEnCours}
          codeGenere={codeOtpGenere}
          onValider={handleValiderOtp}
          onFermer={() => setModalOtpOuvert(false)}
          erreur={erreurOtp}
          chargement={chargementOtp}
        />
      )}

      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">

            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="text-2xl font-semibold text-emerald-600">
                Tepenye
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 mt-4 mb-1">
                Connexion
              </h1>
              <p className="text-sm text-gray-500">
                Accédez à votre espace personnel
              </p>
            </div>

            {/* Onglets */}
            <div className="flex rounded-lg border border-gray-200 p-1 mb-6 gap-1">
              {onglets.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setOnglet(o.id);
                    setErreur(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    onglet === o.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Erreur globale */}
            {erreur && (
              <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-sm text-red-600">{erreur}</p>
              </div>
            )}

            {/* ── Onglet Email ─────────────────────────────────────────────── */}
            {onglet === "email" && (
              <form
                onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
                className="space-y-4"
              >
                <FormField
                  label="Adresse email"
                  error={emailForm.formState.errors.email?.message}
                  required
                >
                  <Input
                    {...emailForm.register("email")}
                    type="email"
                    placeholder="vous@exemple.com"
                    error={!!emailForm.formState.errors.email}
                  />
                </FormField>

                <FormField
                  label="Mot de passe"
                  error={emailForm.formState.errors.motDePasse?.message}
                  required
                >
                  <Input
                    {...emailForm.register("motDePasse")}
                    type="password"
                    placeholder="Votre mot de passe"
                    error={!!emailForm.formState.errors.motDePasse}
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={emailForm.formState.isSubmitting}
                  className="w-full py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {emailForm.formState.isSubmitting
                    ? "Connexion..."
                    : "Se connecter"}
                </button>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Comptes de démonstration :
                  </p>
                  <p className="text-xs text-gray-400">
                    Agent : nadine.amevor@gmail.com
                  </p>
                  <p className="text-xs text-gray-400">
                    Agence : contact@agence-lafa.tg
                  </p>
                  <p className="text-xs text-gray-400">
                    (mot de passe : n'importe lequel)
                  </p>
                </div>
              </form>
            )}

            {/* ── Onglet Téléphone ─────────────────────────────────────────── */}
            {onglet === "telephone" && (
              <form
                onSubmit={telephoneForm.handleSubmit(handleTelephoneSubmit)}
                className="space-y-4"
              >
                <FormField
                  label="Numéro de téléphone"
                  error={telephoneForm.formState.errors.telephone?.message}
                  required
                  hint="Ex : +228 90 12 34 56"
                >
                  <Input
                    {...telephoneForm.register("telephone")}
                    type="tel"
                    placeholder="+228 90 XX XX XX"
                    error={!!telephoneForm.formState.errors.telephone}
                  />
                </FormField>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs text-blue-600">
                    📱 Un code de vérification à 4 chiffres vous sera envoyé par
                    SMS. En mode démo, il s'affiche directement à l'écran.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={telephoneForm.formState.isSubmitting}
                  className="w-full py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {telephoneForm.formState.isSubmitting
                    ? "Envoi du code..."
                    : "Recevoir le code"}
                </button>
              </form>
            )}

            {/* ── Onglet Google ─────────────────────────────────────────────── */}
            {onglet === "google" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center">
                  Connectez-vous avec votre compte Google. Si vous n'avez pas
                  encore de compte Tepenye, il sera créé automatiquement.
                </p>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={chargementGoogle}
                  className="w-full py-3 flex items-center justify-center gap-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {chargementGoogle ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span className="text-sm">Redirection vers Google...</span>
                    </>
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
                      <span className="text-sm">Continuer avec Google</span>
                    </>
                  )}
                </button>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs text-amber-600">
                    ⚙️ Nécessite{" "}
                    <code className="font-mono bg-amber-100 px-1 rounded">
                      GOOGLE_CLIENT_ID
                    </code>{" "}
                    et{" "}
                    <code className="font-mono bg-amber-100 px-1 rounded">
                      GOOGLE_CLIENT_SECRET
                    </code>{" "}
                    dans{" "}
                    <code className="font-mono bg-amber-100 px-1 rounded">
                      .env.local
                    </code>
                    .
                  </p>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="text-emerald-600 hover:underline font-medium"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}