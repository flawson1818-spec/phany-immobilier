import Link from "next/link";
import type { Prisma, PropertyStatus } from "@prisma/client";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";
import { PropertyStatusBadge } from "@/components/StatusBadge";
import { ModerationActions } from "@/components/ModerationActions";
import { formatPrice } from "@/lib/format";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const FILTERS: (PropertyStatus | "ALL")[] = ["PENDING", "VERIFIED", "NEEDS_FIX", "PUBLISHED", "REJECTED", "ALL"];

export default async function AdminProperties({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireRole(ADMIN_ROLES);
  const { status } = await searchParams;

  const where: Prisma.PropertyWhereInput = {};
  if (status && status !== "ALL" && status in STATUS_LABELS) {
    where.status = status as PropertyStatus;
  }

  const properties = await prisma.property.findMany({
    where,
    include: {
      owner: { select: { name: true, phone: true, email: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
      _count: { select: { visits: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  return (
    <DashboardShell area="admin" role={user.role} title="Modération des annonces">
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin/properties" : `/admin/properties?status=${f}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              (status ?? "PENDING") === f || (!status && f === "PENDING")
                ? "bg-navy-700 text-white"
                : "bg-white text-navy-700 border border-navy-100"
            }`}
          >
            {f === "ALL" ? "Toutes" : STATUS_LABELS[f]}
          </Link>
        ))}
      </div>

      {properties.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-100 bg-white p-8 text-center text-sm text-muted">
          Aucune annonce dans cette catégorie.
        </p>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div key={p.id} className="rounded-xl border border-navy-100 bg-white p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-navy-50">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/properties/${p.id}`}
                      className="font-semibold text-navy-800 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <PropertyStatusBadge status={p.status} />
                    <span className="font-mono text-xs text-muted">{p.reference}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {OPERATION_LABELS[p.operation]} · {PROPERTY_TYPE_LABELS[p.type]} · {p.district},{" "}
                    {p.city} · {formatPrice(p.price)} · {p._count.visits} visite(s)
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {p.owner.name} · {p.owner.phone ?? p.owner.email}
                  </div>
                  {p.reviewNote && (
                    <div className="mt-1 text-xs text-bordeaux-600">Note : {p.reviewNote}</div>
                  )}
                </div>
              </div>
              <div className="mt-3 border-t border-navy-100 pt-3">
                <ModerationActions id={p.id} status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
