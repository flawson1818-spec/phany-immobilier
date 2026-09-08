import "server-only";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES } from "./constants";

export type StoredFile = { url: string; path: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "properties";

const supabase =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    : null;

export function storageMode(): "supabase" | "local" {
  return supabase ? "supabase" : "local";
}

function extFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function assertValidImage(file: { type: string; size: number }) {
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    throw new Error("Format d'image non autorisé (JPEG, PNG ou WebP uniquement).");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image trop lourde (max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} Mo).`);
  }
}

/** Upload une image et renvoie son URL publique + son chemin de stockage. */
export async function uploadPropertyImage(
  propertyId: string,
  file: { type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> },
): Promise<StoredFile> {
  assertValidImage(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${propertyId}/${crypto.randomUUID()}.${extFromMime(file.type)}`;

  if (supabase) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Échec de l'upload: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    return { url: data.publicUrl, path: key };
  }

  // Fallback local (dev) : public/uploads/<key>
  const dir = path.join(process.cwd(), "public", "uploads", propertyId);
  await fs.mkdir(dir, { recursive: true });
  const filename = key.split("/").pop()!;
  await fs.writeFile(path.join(dir, filename), buffer);
  return { url: `/uploads/${key}`, path: key };
}

export async function deletePropertyImage(storagePath: string) {
  if (supabase) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return;
  }
  try {
    await fs.unlink(path.join(process.cwd(), "public", "uploads", storagePath));
  } catch {
    /* déjà supprimé */
  }
}
