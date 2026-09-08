import "server-only";
import crypto from "crypto";
import type { Property } from "@prisma/client";

/** Référence lisible : PHANY-LOM-8F3K2A */
export function generateReference(city = "Lomé") {
  const prefix = city.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "LOM";
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `PHANY-${prefix}-${rand}`;
}

/** Rend un Property sérialisable en JSON (Decimal -> string). */
export function serializeProperty<T extends Partial<Property>>(p: T) {
  return {
    ...p,
    price: p.price != null ? p.price.toString() : undefined,
  };
}

/** Statuts qu'un propriétaire a le droit de modifier / re-soumettre. */
export const OWNER_EDITABLE_STATUSES = ["DRAFT", "NEEDS_FIX", "REJECTED"] as const;
