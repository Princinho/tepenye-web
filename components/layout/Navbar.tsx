"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/AuthContext";
import { useFavoris } from "@/hooks/useFavoris";

export default function Navbar() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { estConnecte, utilisateur, logout } = useAuthContext();
  const { data: favoris = [] } = useFavoris(utilisateur?.id);

  const handleLogout = () => {
    logout();
    router.push("/");
    setMenuOuvert(false);
  };

  const lienActif = (href: string) =>
    pathname === href
      ? "text-emerald-600 font-medium"
      : "text-gray-600 hover:text-gray-900";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold text-emerald-600 flex-shrink-0">
          Tepenye
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/annonces" className={`text-sm transition-colors ${lienActif("/annonces")}`}>
            Annonces
          </Link>

          {/* Favoris — uniquement connecté */}
          {estConnecte && (
            <Link
              href="/favoris"
              className={`text-sm transition-colors relative ${lienActif("/favoris")}`}
            >
              Favoris
              {favoris.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {favoris.length > 9 ? "9+" : favoris.length}
                </span>
              )}
            </Link>
          )}

          <Link
            href="/publier"
            className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Publier une annonce
          </Link>

          {estConnecte ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className={`text-sm transition-colors ${lienActif("/dashboard")}`}
              >
                Mon espace
              </Link>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm">
                  {utilisateur?.nom.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Connexion
            </Link>
          )}
        </div>

        {/* Hamburger mobile */}
        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${menuOuvert ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-opacity duration-200 ${menuOuvert ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${menuOuvert ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Menu mobile */}
      {menuOuvert && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col gap-1">
            <Link
              href="/annonces"
              onClick={() => setMenuOuvert(false)}
              className={`text-sm px-4 py-3 rounded-lg transition-colors ${
                pathname === "/annonces"
                  ? "bg-emerald-50 text-emerald-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Annonces
            </Link>

            {estConnecte && (
              <Link
                href="/favoris"
                onClick={() => setMenuOuvert(false)}
                className={`text-sm px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                  pathname === "/favoris"
                    ? "bg-emerald-50 text-emerald-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Favoris</span>
                {favoris.length > 0 && (
                  <span className="text-xs font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    {favoris.length}
                  </span>
                )}
              </Link>
            )}

            <Link
              href="/publier"
              onClick={() => setMenuOuvert(false)}
              className="text-sm bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors text-center font-medium"
            >
              Publier une annonce
            </Link>

            {estConnecte ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOuvert(false)}
                  className={`text-sm px-4 py-3 rounded-lg transition-colors ${
                    pathname === "/dashboard"
                      ? "bg-emerald-50 text-emerald-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Mon espace ({utilisateur?.nom})
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm px-4 py-3 rounded-lg text-left text-red-500 hover:bg-red-50 transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOuvert(false)}
                className="text-sm px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}