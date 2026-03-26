import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-emerald-600">
          Tepenye
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/annonces"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Annonces
          </Link>
          <Link
            href="/publier"
            className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Publier une annonce
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Connexion
          </Link>
        </div>
      </div>
    </nav>
  );
}