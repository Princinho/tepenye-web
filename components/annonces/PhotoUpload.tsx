"use client";

import { useCallback, useState } from "react";
import Image from "next/image";

interface PhotoUploadProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  error?: string;
}

export default function PhotoUpload({ photos, onChange, error }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const validFiles = Array.from(files).filter((file) => {
        const isValidType = ["image/jpeg", "image/png"].includes(file.type);
        const isValidSize = file.size <= 2 * 1024 * 1024; // 2 Mo
        return isValidType && isValidSize;
      });

      const newPhotos = [...photos, ...validFiles].slice(0, 10);
      onChange(newPhotos);

      // Générer les previews
      const newPreviews = newPhotos.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
    },
    [photos, onChange]
  );

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onChange(newPhotos);
    setPreviews(newPreviews);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${error
            ? "border-red-300 bg-red-50"
            : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50"
          }`}
        onClick={() => document.getElementById("photo-input")?.click()}
      >
        <div className="text-4xl mb-3">📷</div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          Glisser-déposer vos photos ici
        </p>
        <p className="text-xs text-gray-400">
          ou cliquer pour sélectionner — JPG/PNG, max 2 Mo par photo
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {photos.length}/10 photo{photos.length > 1 ? "s" : ""} —
          {photos.length < 4 && (
            <span className="text-amber-500"> minimum 4 requises</span>
          )}
          {photos.length >= 4 && (
            <span className="text-emerald-500"> ✓ minimum atteint</span>
          )}
        </p>
        <input
          id="photo-input"
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Grille de previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
            >
              <Image
                src={preview}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
              {/* Overlay suppression */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
              >
                Supprimer
              </button>
              {/* Badge numéro */}
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}