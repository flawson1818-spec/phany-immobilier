import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";
import { PropertyCard } from "@/components/PropertyCard";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await requireRole(["CLIENT", "ADMIN", "SUPER_ADMIN"]);
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      property: {
        include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell area="client" role={user.role} title="Mes favoris">
      {favorites.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-100 bg-white p-8 text-center text-sm text-muted">
          Aucun favori pour l&apos;instant.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => (
            <PropertyCard
              key={f.id}
              property={{ ...f.property, price: f.property.price.toString() }}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
