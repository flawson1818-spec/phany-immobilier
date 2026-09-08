import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { FavoriteButton, VisitRequestButton } from "@/components/PropertyActions";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatPrice, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      owner: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!property) notFound();

  // Un bien non publié n'est visible que par son propriétaire ou un admin.
  const canSeeUnpublished =
    user && (user.id === property.ownerId || isAdmin(user.role));
  if (property.status !== "PUBLISHED" && !canSeeUnpublished) notFound();

  const favorited = user
    ? (await prisma.favorite.findUnique({
        where: { userId_propertyId: { userId: user.id, propertyId: property.id } },
      })) != null
    : false;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/properties" className="text-sm text-muted">
          ← Retour aux annonces
        </Link>

        {property.status !== "PUBLISHED" && (
          <div className="mt-3 rounded-lg border border-gold-400/40 bg-gold-400/10 px-3 py-2 text-sm text-gold-600">
            Aperçu privé — statut : {property.status}
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-50">
            {property.images[0] ? (
              <Image
                src={property.images[0].url}
                alt={property.images[0].alt ?? property.title}
                fill
                sizes="(max-width:768px) 100vw, 640px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">Pas de photo</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {property.images.slice(1, 5).map((img) => (
              <div key={img.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy-50">
                <Image src={img.url} alt={img.alt ?? ""} fill sizes="200px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[2fr_1fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              {OPERATION_LABELS[property.operation]} · {PROPERTY_TYPE_LABELS[property.type]} ·{" "}
              {property.reference}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-navy-800">{property.title}</h1>
            <div className="mt-1 text-muted">
              {property.district}, {property.city}
              {property.address ? ` — ${property.address}` : ""}
            </div>

            <div className="mt-4 text-3xl font-black text-bordeaux-600">
              {formatPrice(property.price)}
              {property.operation === "RENT" && (
                <span className="text-sm font-medium text-muted"> /mois</span>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Chambres", property.bedrooms],
                ["Salles d'eau", property.bathrooms],
                ["Surface", property.surface ? `${property.surface} m²` : null],
                ["Meublé", property.furnished ? "Oui" : "Non"],
                ["Disponible", property.availableFrom ? formatDate(property.availableFrom) : "Maintenant"],
              ]
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => (
                  <div key={String(k)} className="rounded-xl border border-navy-100 bg-white p-3">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="font-semibold text-navy-800">{String(v)}</dd>
                  </div>
                ))}
            </dl>

            {property.features.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {property.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink">
              {property.description}
            </div>
          </div>

          <aside className="h-fit space-y-3 rounded-2xl border border-navy-100 bg-white p-5">
            <div className="text-sm text-muted">Publié par</div>
            <div className="font-semibold text-navy-800">{property.owner.name}</div>
            {property.status === "PUBLISHED" && (
              <>
                <VisitRequestButton propertyId={property.id} authenticated={!!user} />
                <FavoriteButton
                  propertyId={property.id}
                  initial={favorited}
                  authenticated={!!user}
                />
              </>
            )}
            <p className="text-xs text-muted">
              PHANY vérifie chaque annonce. Ne versez jamais d&apos;argent avant une visite
              organisée par PHANY.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
