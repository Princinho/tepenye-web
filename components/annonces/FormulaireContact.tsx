"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuthContext } from "@/lib/AuthContext";
import { useEnvoyerMessage } from "@/hooks/useContact";
import { useVoirNumero, useNumeroDebloque } from "@/hooks/useVoirNumero";
import FormField from "@/components/ui/FormField";

const contactSchema = z.object({
  contenu: z
    .string()
    .min(10, "Message trop court (minimum 10 caractères)")
    .max(1000, "Message trop long (maximum 1000 caractères)"),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface FormulaireContactProps {
  annonceId: string;
  auteurId: string;
  masquerTelephone: boolean;
}

// ─── Sous-composant : affichage du numéro ─────────────────────────────────────

function SectionNumero({
  annonceId,
  auteurId,
  utilisateurId,
}: {
  annonceId: string;
  auteurId: string;
  utilisateurId: string;
}) {
  const { mutate: voirNumero, isPending: debloquePending } = useVoirNumero();
  const [erreur, setErreur] = useState<string | null>(null);

  // Source de vérité : localStorage d'abord, base en fallback si localStorage perdu
  const {
    data: telephoneDebloque,
    isLoading: verificationPending,
  } = useNumeroDebloque(utilisateurId, annonceId, auteurId);

  const handleDebloquer = () => {
    setErreur(null);
    voirNumero(
      { auteurId, annonceId, utilisateurId },
      {
        onError: (err) =>
          setErreur(
            err instanceof Error ? err.message : "Erreur inattendue."
          ),
      }
    );
  };

  // Vérification en cours (check localStorage + base)
  if (verificationPending) {
    return (
      <div className="w-full py-3 flex items-center justify-center gap-2 border border-gray-100 rounded-lg">
        <span className="w-3.5 h-3.5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
        <span className="text-xs text-gray-400">Vérification...</span>
      </div>
    );
  }

  // Numéro déjà débloqué (localStorage ou base)
  if (telephoneDebloque) {
    return (
      <a
        href={`tel:${telephoneDebloque}`}
        className="w-full py-3 flex items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors"
      >
        📞{" "}
        <span className="font-mono tracking-wide">{telephoneDebloque}</span>
      </a>
    );
  }

  // Crédits insuffisants côté agent
  if (erreur) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
        <p className="text-xs text-amber-700 font-medium">
          Numéro non disponible
        </p>
        <p className="text-xs text-amber-600">{erreur}</p>
      </div>
    );
  }

  // Bouton de déblocage (premier accès)
  return (
    <button
      onClick={handleDebloquer}
      disabled={debloquePending}
      className="w-full py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {debloquePending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          Vérification...
        </span>
      ) : (
        "📞 Voir le numéro"
      )}
    </button>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function FormulaireContact({
  annonceId,
  auteurId,
  masquerTelephone,
}: FormulaireContactProps) {
  const { utilisateur, estConnecte } = useAuthContext();
  const { mutate: envoyerMessage, isPending: envoyiPending } =
    useEnvoyerMessage();

  const [messageEnvoye, setMessageEnvoye] = useState(false);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (data: ContactFormData) => {
    if (!utilisateur) return;
    envoyerMessage(
      { annonceId, expediteurId: utilisateur.id, contenu: data.contenu },
      {
        onSuccess: () => {
          setMessageEnvoye(true);
          reset();
          setFormulaireOuvert(false);
        },
      }
    );
  };

  // ── Non connecté ─────────────────────────────────────────────────────────
  if (!estConnecte) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center space-y-3">
        <p className="text-sm text-gray-600">
          Connectez-vous pour contacter l&apos;agent
        </p>
        <Link
          href="/login"
          className="block w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Se connecter
        </Link>
        <Link
          href="/register"
          className="block w-full py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Créer un compte gratuit
        </Link>
      </div>
    );
  }

  // ── Message envoyé ────────────────────────────────────────────────────────
  if (messageEnvoye) {
    return (
      <div className="space-y-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center space-y-1">
          <div className="text-2xl">✅</div>
          <p className="text-sm font-medium text-emerald-800">
            Message envoyé !
          </p>
          <p className="text-xs text-emerald-600">
            L&apos;agent vous contactera bientôt.
          </p>
          <button
            onClick={() => setMessageEnvoye(false)}
            className="text-xs text-emerald-600 hover:underline pt-1 block"
          >
            Envoyer un autre message
          </button>
        </div>

        {!masquerTelephone && (
          <SectionNumero
            annonceId={annonceId}
            auteurId={auteurId}
            utilisateurId={utilisateur.id}
          />
        )}
      </div>
    );
  }

  // ── Formulaire fermé (état par défaut) ────────────────────────────────────
  if (!formulaireOuvert) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setFormulaireOuvert(true)}
          className="w-full py-3 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          ✉️ Envoyer un message
        </button>

        {!masquerTelephone && (
          <SectionNumero
            annonceId={annonceId}
            auteurId={auteurId}
            utilisateurId={utilisateur.id}
          />
        )}
      </div>
    );
  }

  // ── Formulaire ouvert ─────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          label="Votre message"
          error={errors.contenu?.message}
          required
        >
          <textarea
            {...register("contenu")}
            rows={4}
            placeholder="Bonjour, je suis intéressé(e) par votre annonce. Pourriez-vous me donner plus d'informations ?"
            className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors resize-none ${
              errors.contenu
                ? "border-red-300 focus:border-red-500 bg-red-50"
                : "border-gray-200 focus:border-emerald-500"
            }`}
            autoFocus
          />
        </FormField>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormulaireOuvert(false)}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={envoyiPending}
            className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {envoyiPending ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-400 text-center">
        Envoyé en tant que{" "}
        <span className="font-medium text-gray-500">{utilisateur?.nom}</span>
      </p>
    </div>
  );
}