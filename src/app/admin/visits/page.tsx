import Link from "next/link";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";
import { VisitStatusBadge } from "@/components/StatusBadge";
import { VisitAdminActions } from "@/components/VisitAdminActions";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminVisits() {
  const user = await requireRole(ADMIN_ROLES);

  const [visits, agents] = await Promise.all([
    prisma.visit.findMany({
      include: {
        property: { select: { id: true, reference: true, title: true, district: true } },
        client: { select: { name: true, phone: true } },
        agent: { select: { name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: { in: ["AGENT", "ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <DashboardShell area="admin" role={user.role} title="Visites">
      {visits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-100 bg-white p-8 text-center text-sm text-muted">
          Aucune demande de visite.
        </p>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v.id} className="rounded-xl border border-navy-100 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/properties/${v.property.id}`} className="font-semibold text-navy-800">
                  {v.property.title}
                </Link>
                <VisitStatusBadge status={v.status} />
                <span className="font-mono text-xs text-muted">{v.property.reference}</span>
              </div>
              <div className="mt-1 text-xs text-muted">
                Client : {v.client.name} ({v.client.phone ?? "—"}) · Souhait :{" "}
                {formatDateTime(v.scheduledAt)} · Agent : {v.agent?.name ?? "—"}
              </div>
              {v.note && <div className="mt-1 text-xs text-navy-700">« {v.note} »</div>}
              <div className="mt-3 border-t border-navy-100 pt-3">
                <VisitAdminActions id={v.id} status={v.status} agents={agents} />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
