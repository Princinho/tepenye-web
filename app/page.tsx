import Link from "next/link";

export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-semibold text-gray-900 mb-4">
        Trouve ton logement à Lomé
      </h1>
      <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
        Des centaines d'annonces vérifiées. Recherche par quartier, budget, ou type de bien.
      </p>
      <Link
        href="/annonces"
        className="bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-emerald-700 transition-colors inline-block"
      >
        Voir les annonces
      </Link>
    </div>
  );
}