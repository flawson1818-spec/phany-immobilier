import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { AiSearch } from "@/components/AiSearch";
import { PropertyCard } from "@/components/PropertyCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latest = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
    },
    orderBy: { publishedAt: "desc" },
    take: 6,
  });

  return (
    <>
      <SiteHeader />

      <section className="bg-gradient-to-br from-navy-700 to-navy-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">
            Trouvez votre bien avec l&apos;intelligence de PHANY.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/85">
            Décrivez ce que vous cherchez en langage naturel. PHANY AI transforme votre demande en
            critères précis et cherche uniquement parmi les annonces <strong>vérifiées et
            publiées</strong>.
          </p>
          <div className="mt-8">
            <AiSearch />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-navy-800">Dernières annonces publiées</h2>
          <Link href="/properties" className="text-sm font-semibold text-bordeaux-600">
            Voir toutes les annonces →
          </Link>
        </div>

        {latest.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-navy-100 bg-white p-8 text-center text-sm text-muted">
            Aucune annonce publiée pour le moment.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => (
              <PropertyCard
                key={p.id}
                property={{ ...p, price: p.price.toString() }}
              />
            ))}
          </div>
        )}

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              t: "Annonces vérifiées",
              d: "Chaque bien passe par une vérification PHANY avant publication. Pas de doublon, pas d'arnaque.",
            },
            {
              t: "PHANY AI",
              d: "Une recherche qui comprend « 3 chambres à Agoè avec parking, max 250 000 F ». Jamais de bien inventé.",
            },
            {
              t: "Visites organisées",
              d: "Demandez une visite en ligne, PHANY confirme et affecte un agent.",
            },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-navy-100 bg-white p-5">
              <div className="phany-logo text-sm">
                P<span className="h">H</span>ANY
              </div>
              <h3 className="mt-2 font-bold text-navy-800">{f.t}</h3>
              <p className="mt-1 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-navy-100 bg-white px-4 py-8 text-center text-sm text-muted">
        <div className="phany-logo">
          P<span className="h">H</span>ANY IMMOBILIER
        </div>
        <p className="mt-1">Lomé, Togo · Immobilier intelligent</p>
      </footer>
    </>
  );
}
