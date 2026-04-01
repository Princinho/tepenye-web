"use client";

import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/AuthContext";
import { useFavoris, useToggleFavori } from "@/hooks/useFavoris";

interface BoutonFavoriProps {
  annonceId: string;
  /** "card" = petit bouton superposé sur la photo, "detail" = bouton pleine largeur dans la sidebar */
  variante?: "card" | "detail";
}

export default function BoutonFavori({
  annonceId,
  variante = "card",
}: BoutonFavoriProps) {
  const router = useRouter();
  const { utilisateur, estConnecte } = useAuthContext();

  const { data: favoris = [] } = useFavoris(utilisateur?.id);
  const favoriExistant = favoris.find((f) => f.annonceId === annonceId);
  const estFavori = !!favoriExistant;

  const { mutate: toggleFavori, isPending } = useToggleFavori(utilisateur?.id);

  const handleClick = (e: React.MouseEvent) => {
    // Empêche la propagation vers le Link parent (dans AnnonceCard)
    e.preventDefault();
    e.stopPropagation();

    if (!estConnecte) {
      router.push("/login");
      return;
    }

    toggleFavori({
      annonceId,
      estFavori,
      favoriId: favoriExistant?.id,
    });
  };

  if (variante === "detail") {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        aria-label={estFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={`w-full py-3 rounded-lg text-sm font-medium border transition-all ${
          estFavori
            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            : "border-gray-200 text-gray-700 hover:bg-gray-50"
        } disabled:opacity-50`}
      >
        {estFavori ? "♥ Retirer des favoris" : "♡ Ajouter aux favoris"}
      </button>
    );
  }

  // Variante "card" — bouton flottant en haut à droite de la photo
  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={estFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full shadow-md transition-all
        ${
          estFavori
            ? "bg-red-500 text-white"
            : "bg-white/90 text-gray-500 hover:text-red-500"
        } disabled:opacity-50`}
    >
      <span className="text-base leading-none">{estFavori ? "♥" : "♡"}</span>
    </button>
  );
}