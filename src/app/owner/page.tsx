import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";
import { PropertyStatusBadge } from "@/components/StatusBadge";
import { ButtonLink } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function OwnerHome() {
  const user = await requireRole(["OWNER", "ADMIN", "SUPER_ADMIN"]);
  const properties = await prisma.property.findMany({
    where: { ownerId: user.id },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
      _count: { select: { visits: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <DashboardShell area="owner" role={user.role} title="Mes biens">
      <div className="mb-4">
        <ButtonLink href="/owner/properties/new" variant="gold">
          + Ajouter un bien
        </ButtonLink>
      </div>

      {properties.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-100 bg-white p-8 text-center text-sm text-muted">
          Vous n&apos;avez pas encore de bien. Cliquez sur « Ajouter un bien » pour commencer.
        </p>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/owner/properties/${p.id}/edit`}
              className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-3 hover:shadow-md"
            >
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-navy-50">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-navy-800">{p.title}</span>
                  <PropertyStatusBadge status={p.status} />
                </div>
                <div className="text-xs text-muted">
                  {OPERATION_LABELS[p.operation]} · {PROPERTY_TYPE_LABELS[p.type]} · {p.district} ·{" "}
                  {formatPrice(p.price)} · {p._count.visits} visite(s)
                </div>
                {p.reviewNote && p.status === "NEEDS_FIX" && (
                  <div className="mt-1 text-xs text-bordeaux-600">À corriger : {p.reviewNote}</div>
                )}
              </div>
              <span className="text-sm text-muted">→</span>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
