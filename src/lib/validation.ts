import { z } from "zod";

const propertyTypes = [
  "HOUSE",
  "APARTMENT",
  "STUDIO",
  "VILLA",
  "LAND",
  "SHOP",
  "OFFICE",
  "WAREHOUSE",
  "BUILDING",
  "FURNISHED",
] as const;

const operations = ["RENT", "SALE"] as const;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9 ()-]{6,20}$/, "Téléphone invalide")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "8 caractères minimum").max(100),
  role: z.enum(["CLIENT", "OWNER"]).default("CLIENT"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "8 caractères minimum").max(100),
});

export const propertyInputSchema = z.object({
  title: z.string().trim().min(5, "Titre trop court").max(160),
  type: z.enum(propertyTypes),
  operation: z.enum(operations),
  price: z.coerce.number().positive("Prix invalide").max(100_000_000_000),
  city: z.string().trim().min(2).max(80).default("Lomé"),
  district: z.string().trim().min(2, "Quartier requis").max(80),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  surface: z.coerce.number().positive().max(1_000_000).optional(),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional(),
  furnished: z
    .preprocess((v) => v === true || v === "true" || v === "on" || v === 1, z.boolean())
    .default(false),
  features: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  description: z.string().trim().min(20, "Description trop courte (20 caractères min.)").max(4000),
  availableFrom: z.coerce.date().optional(),
});

export const propertyUpdateSchema = propertyInputSchema.partial();

export const adminPropertyActionSchema = z.object({
  action: z.enum(["verify", "publish", "reject", "needs_fix", "archive", "unpublish"]),
  reviewNote: z.string().trim().max(1000).optional(),
});

export const visitRequestSchema = z.object({
  propertyId: z.string().min(1),
  preferredAt: z.coerce.date().optional(),
  note: z.string().trim().max(500).optional(),
});

export const visitUpdateSchema = z.object({
  action: z.enum(["confirm", "assign", "complete", "cancel"]),
  agentId: z.string().min(1).optional(),
  scheduledAt: z.coerce.date().optional(),
  note: z.string().trim().max(500).optional(),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT", "OWNER", "CLIENT"]).optional(),
  isActive: z.boolean().optional(),
});

export const aiSearchSchema = z.object({
  query: z.string().trim().min(3, "Décrivez votre recherche").max(500),
});

export type PropertyInput = z.infer<typeof propertyInputSchema>;
