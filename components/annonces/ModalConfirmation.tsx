"use client";

interface ModalConfirmationActionProps {
  titre: string;
  description: string;
  labelConfirmer: string;
  varianteConfirmer?: "danger" | "warning" | "success" | "primary";
  isPending?: boolean;
  onConfirmer: () => void;
  onAnnuler: () => void;
}

const VARIANTE_STYLES = {
  danger: "bg-red-500 hover:bg-red-600 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  primary: "bg-gray-800 hover:bg-gray-900 text-white",
};

export default function ModalConfirmationAction({
  titre,
  description,
  labelConfirmer,
  varianteConfirmer = "primary",
  isPending = false,
  onConfirmer,
  onAnnuler,
}: ModalConfirmationActionProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onAnnuler()}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">
            {titre}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onAnnuler}
            disabled={isPending}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirmer}
            disabled={isPending}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${VARIANTE_STYLES[varianteConfirmer]}`}
          >
            {isPending ? "En cours..." : labelConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}