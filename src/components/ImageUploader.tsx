"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Alert } from "./ui";
import { MAX_IMAGES_PER_PROPERTY } from "@/lib/constants";

type Img = { id: string; url: string; isPrimary: boolean };

/** Compresse une image côté navigateur (max 1600px, JPEG q0.82). */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/webp") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

export function ImageUploader({ propertyId, initial }: { propertyId: string; initial: Img[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<Img[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const room = MAX_IMAGES_PER_PROPERTY - images.length;
    const files = Array.from(list).slice(0, room);

    start(async () => {
      const fd = new FormData();
      for (const f of files) fd.append("files", await compress(f));
      const res = await fetch(`/api/properties/${propertyId}/images`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload impossible");
        return;
      }
      setImages((cur) => [...cur, ...json.images]);
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await fetch(`/api/properties/${propertyId}/images?imageId=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setImages((cur) => cur.filter((i) => i.id !== id));
        router.refresh();
      }
    });
  }

  function makePrimary(id: string) {
    start(async () => {
      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId: id }),
      });
      if (res.ok) {
        const json = await res.json();
        setImages(json.images);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-navy-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-800">Photos ({images.length}/{MAX_IMAGES_PER_PROPERTY})</h3>
        <Button
          type="button"
          variant="outline"
          disabled={pending || images.length >= MAX_IMAGES_PER_PROPERTY}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Envoi…" : "Ajouter des photos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {images.length === 0 ? (
        <p className="text-sm text-muted">Ajoutez au moins une photo pour pouvoir soumettre le bien.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border border-navy-100">
              <div className="relative aspect-[4/3] bg-navy-50">
                <Image src={img.url} alt="" fill sizes="200px" className="object-cover" />
              </div>
              {img.isPrimary && (
                <span className="absolute left-1 top-1 rounded bg-bordeaux-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Principale
                </span>
              )}
              <div className="flex justify-between gap-1 p-1 text-xs">
                {!img.isPrimary && (
                  <button
                    type="button"
                    className="text-navy-700 hover:underline"
                    onClick={() => makePrimary(img.id)}
                  >
                    Définir principale
                  </button>
                )}
                <button
                  type="button"
                  className="ml-auto text-bordeaux-600 hover:underline"
                  onClick={() => remove(img.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
