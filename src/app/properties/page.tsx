import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { PropertyCard } from "@/components/PropertyCard";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, BUDGET_STEPS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | undefined>>;

export default async function PropertiesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const where: Prisma.PropertyWhereInput = { status: "PUBLISHED" };
  if (sp.operation === "RENT" || sp.operation === "SALE") where.operation = sp.operation;
  if (sp.type && sp.type in PROPERTY_TYPE_LABELS)
    where.type = sp.type as Prisma.PropertyWhereInput["type"];
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q, mode: "insensitive" } },
      { district: { contains: sp.q, mode: "insensitive" } },
      { city: { contains: sp.q, mode: "insensitive" } },
      { description: { contains: sp.q, mode: "insensitive" } },
    ];
  }
  if (sp.max) where.price = { lte: Number(sp.max) };

  const properties = await prisma.property.findMany({
    where,
    include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
    orderBy: { publishedAt: "desc" },
    take: 60,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-navy-800">Annonces publiées</h1>

        <form className="mt-4 grid gap-3 rounded-2xl border border-navy-100 bg-white p-4 sm:grid-cols-4">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Quartier, ville, mot-clé…"
            className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-navy-600"
          />
          <select
            name="operation"
            defaultValue={sp.operation ?? ""}
            className="rounded-lg border border-navy-100 px-3 py-2 text-sm"
          >
            <option value="">Louer ou acheter</option>
            {Object.entries(OPERATION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="rounded-lg border border-navy-100 px-3 py-2 text-sm"
          >
            <option value="">Tous les types</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            name="max"
            defaultValue={sp.max ?? ""}
            className="rounded-lg border border-navy-100 px-3 py-2 text-sm"
          >
            <option value="">Budget max</option>
            {BUDGET_STEPS.map((b) => (
              <option key={b} value={b}>
                {formatPrice(b)}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-white sm:col-span-4">
            Filtrer
          </button>
        </form>

        <p className="mt-4 text-sm text-muted">{properties.length} résultat(s)</p>

        {properties.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-navy-100 bg-white p-8 text-center text-sm text-muted">
            Aucune annonce ne correspond. PHANY n&apos;invente jamais de bien.
          </p>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={{ ...p, price: p.price.toString() }} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
