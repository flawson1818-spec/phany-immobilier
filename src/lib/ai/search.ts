import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { parseQuery } from "./provider";
import type { SearchCriteria } from "./criteria";

const PROPERTY_INCLUDE = {
  images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
  owner: { select: { name: true, phone: true } },
} satisfies Prisma.PropertyInclude;

/** Construit le WHERE Prisma. On force TOUJOURS status = PUBLISHED. */
function buildWhere(c: SearchCriteria): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { status: "PUBLISHED" };
  if (c.operation) where.operation = c.operation;
  if (c.type) where.type = c.type;
  if (c.city) where.city = { contains: c.city, mode: "insensitive" };
  if (c.district) where.district = { contains: c.district, mode: "insensitive" };
  if (c.bedrooms != null) where.bedrooms = { gte: c.bedrooms };
  if (c.bathrooms != null) where.bathrooms = { gte: c.bathrooms };
  if (c.minSurface != null) where.surface = { gte: c.minSurface };
  if (c.furnished != null) where.furnished = c.furnished;

  const price: { gte?: number; lte?: number } = {};
  if (c.minPrice != null) price.gte = c.minPrice;
  if (c.maxPrice != null) price.lte = c.maxPrice;
  if (Object.keys(price).length) where.price = price as Prisma.PropertyWhereInput["price"];

  return where;
}

type ScoredProperty = Prisma.PropertyGetPayload<{ include: typeof PROPERTY_INCLUDE }> & {
  compatibility: number;
  matched: string[];
};

function score(
  p: Prisma.PropertyGetPayload<{ include: typeof PROPERTY_INCLUDE }>,
  c: SearchCriteria,
): { compatibility: number; matched: string[] } {
  let points = 0;
  let total = 0;
  const matched: string[] = [];
  const add = (weight: number, hit: boolean, label: string) => {
    total += weight;
    if (hit) {
      points += weight;
      matched.push(label);
    }
  };

  if (c.operation) add(15, p.operation === c.operation, "opération");
  if (c.type) add(20, p.type === c.type, "type de bien");
  if (c.district) add(20, p.district.toLowerCase().includes(c.district.toLowerCase()), "quartier");
  if (c.bedrooms != null) add(15, (p.bedrooms ?? 0) >= c.bedrooms, "chambres");
  if (c.bathrooms != null) add(8, (p.bathrooms ?? 0) >= c.bathrooms, "salles d'eau");
  if (c.minSurface != null) add(7, (p.surface ?? 0) >= c.minSurface, "surface");
  if (c.furnished != null) add(8, p.furnished === c.furnished, "meublé");
  if (c.maxPrice != null) add(20, Number(p.price) <= c.maxPrice, "budget");
  if (c.minPrice != null) add(5, Number(p.price) >= c.minPrice, "prix plancher");

  if (c.keywords.length) {
    const hay = `${p.title} ${p.description} ${p.features.join(" ")}`.toLowerCase();
    for (const kw of c.keywords) add(5, hay.includes(kw.toLowerCase()), kw);
  }

  // Aucun critère filtrant -> compatibilité neutre.
  const compatibility = total === 0 ? 70 : Math.round((points / total) * 100);
  return { compatibility, matched };
}

export type AiSearchResult = {
  criteria: SearchCriteria;
  provider: string;
  count: number;
  results: Array<Omit<ScoredProperty, "price"> & { price: string }>;
  note: string;
};

export async function runAiSearch(query: string): Promise<AiSearchResult> {
  const { criteria, provider } = await parseQuery(query);
  const where = buildWhere(criteria);

  const rows = await prisma.property.findMany({
    where,
    include: PROPERTY_INCLUDE,
    take: 60,
    orderBy: { publishedAt: "desc" },
  });

  const results = rows
    .map((p) => {
      const s = score(p, criteria);
      return { ...p, price: p.price.toString(), compatibility: s.compatibility, matched: s.matched };
    })
    .sort((a, b) => b.compatibility - a.compatibility);

  return {
    criteria,
    provider,
    count: results.length,
    results,
    note:
      results.length === 0
        ? "Aucun bien PUBLIÉ ne correspond à ces critères. PHANY n'invente jamais d'annonce : élargissez votre recherche ou enregistrez une demande."
        : `${results.length} bien(s) publié(s) correspondent, classés par compatibilité.`,
  };
}
