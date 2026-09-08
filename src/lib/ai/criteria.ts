import { z } from "zod";

/** Critères extraits d'une demande en langage naturel. */
export const criteriaSchema = z.object({
  operation: z.enum(["RENT", "SALE"]).nullable().default(null),
  type: z
    .enum([
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
    ])
    .nullable()
    .default(null),
  city: z.string().nullable().default(null),
  district: z.string().nullable().default(null),
  minPrice: z.number().nonnegative().nullable().default(null),
  maxPrice: z.number().nonnegative().nullable().default(null),
  bedrooms: z.number().int().nonnegative().nullable().default(null),
  bathrooms: z.number().int().nonnegative().nullable().default(null),
  minSurface: z.number().nonnegative().nullable().default(null),
  furnished: z.boolean().nullable().default(null),
  keywords: z.array(z.string()).default([]),
});

export type SearchCriteria = z.infer<typeof criteriaSchema>;

export const EMPTY_CRITERIA: SearchCriteria = {
  operation: null,
  type: null,
  city: null,
  district: null,
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  bathrooms: null,
  minSurface: null,
  furnished: null,
  keywords: [],
};
