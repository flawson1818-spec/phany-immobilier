import type { PropertyType, PropertyOperation, PropertyStatus } from "@prisma/client";

export const APP_NAME = "PHANY IMMOBILIER";

/** Quartiers fréquents de Lomé et environs (utilisés par le parseur PHANY AI). */
export const LOME_DISTRICTS = [
  "Agoè",
  "Adidogomé",
  "Tokoin",
  "Bè",
  "Nyékonakpoè",
  "Hédzranawoé",
  "Baguida",
  "Kégué",
  "Adakpamé",
  "Akodésséwa",
  "Amoutivé",
  "Djidjolé",
  "Totsi",
  "Avépozo",
  "Kodjoviakopé",
  "Cacavéli",
  "Agbalépédogan",
  "Vakpossito",
  "Légbassito",
  "Sanguéra",
  "Adétikopé",
  "Djagblé",
];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  HOUSE: "Maison",
  APARTMENT: "Appartement",
  STUDIO: "Studio",
  VILLA: "Villa",
  LAND: "Terrain",
  SHOP: "Boutique",
  OFFICE: "Bureau",
  WAREHOUSE: "Entrepôt",
  BUILDING: "Immeuble",
  FURNISHED: "Logement meublé",
};

export const OPERATION_LABELS: Record<PropertyOperation, string> = {
  RENT: "Location",
  SALE: "Vente",
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente de vérification",
  NEEDS_FIX: "Correction demandée",
  VERIFIED: "Vérifié",
  PUBLISHED: "Publié",
  RESERVED: "Réservé",
  RENTED: "Loué",
  SOLD: "Vendu",
  ARCHIVED: "Archivé",
  REJECTED: "Refusé",
};

/** Paliers de budget proposés dans les filtres (FCFA). Aucun plafond artificiel. */
export const BUDGET_STEPS = [
  5_000, 10_000, 20_000, 30_000, 40_000, 50_000, 100_000, 250_000, 500_000,
  1_000_000, 2_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000,
];

/** Seuls ces statuts sont visibles dans la recherche publique. */
export const PUBLIC_STATUSES: PropertyStatus[] = ["PUBLISHED"];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const MAX_IMAGES_PER_PROPERTY = 15;
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
