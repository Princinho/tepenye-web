"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const pathname = usePathname();

  const liens = [
    { href: "/annonces", label: "Annonces" },
    { href: "/publier", label: "Publier une annonce", primary: true },
    { href: "/login", label: "Connexion" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-semibold text-emerald-600 flex-shrink-0"
        >
          Tepenye
        </Link>

        {/* Liens desktop */}
        <div className="hidden md:flex items-center gap-4">
          {liens.map((lien) =>
            lien.primary ? (
              <Link
                key={lien.href}
                href={lien.href}
                className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {lien.label}
              </Link>
            ) : (
              <Link
                key={lien.href}
                href={lien.href}
                className={`text-sm transition-colors ${
                  pathname === lien.href
                    ? "text-emerald-600 font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {lien.label}
              </Link>
            )
          )}
        </div>

        {/* Bouton hamburger mobile */}
        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          <span
            className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${
              menuOuvert ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-700 transition-opacity duration-200 ${
              menuOuvert ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${
              menuOuvert ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Menu dropdown mobile */}
      {menuOuvert && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col gap-1">
            {liens.map((lien) =>
              lien.primary ? (
                <Link
                  key={lien.href}
                  href={lien.href}
                  onClick={() => setMenuOuvert(false)}
                  className="text-sm bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors text-center font-medium mt-1"
                >
                  {lien.label}
                </Link>
              ) : (
                <Link
                  key={lien.href}
                  href={lien.href}
                  onClick={() => setMenuOuvert(false)}
                  className={`text-sm px-4 py-3 rounded-lg transition-colors ${
                    pathname === lien.href
                      ? "bg-emerald-50 text-emerald-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {lien.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}