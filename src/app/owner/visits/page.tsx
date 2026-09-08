import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";
import { VisitStatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerVisitsPage() {
  const user = await requireRole(["OWNER", "ADMIN", "SUPER_ADMIN"]);
  const visits = await prisma.visit.findMany({
    where: { property: { ownerId: user.id } },
    include: {
      property: { select: { reference: true, title: true } },
      client: { select: { name: true, phone: true } },
      agent: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell area="owner" role={user.role} title="Demandes de visite">
      {visits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-100 bg-white p-8 text-center text-sm text-muted">
          Aucune demande de visite pour vos biens.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="p-3">Bien</th>
                <th className="p-3">Client</th>
                <th className="p-3">Souhait</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Agent</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.id} className="border-t border-navy-100">
                  <td className="p-3">
                    <div className="font-medium text-navy-800">{v.property.title}</div>
                    <div className="font-mono text-xs text-muted">{v.property.reference}</div>
                  </td>
                  <td className="p-3">
                    {v.status === "COMPLETED" || v.status === "ASSIGNED" || v.status === "CONFIRMED" ? (
                      <>
                        {v.client.name}
                        <div className="text-xs text-muted">{v.client.phone ?? "—"}</div>
                      </>
                    ) : (
                      <span className="text-muted">Communiqué après confirmation</span>
                    )}
                  </td>
                  <td className="p-3 text-muted">{formatDateTime(v.scheduledAt)}</td>
                  <td className="p-3">
                    <VisitStatusBadge status={v.status} />
                  </td>
                  <td className="p-3 text-muted">{v.agent?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
