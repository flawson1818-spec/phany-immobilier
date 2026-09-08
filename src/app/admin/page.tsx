import Link from "next/link";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

function Kpi({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-navy-100 bg-white p-4">
      <div className="text-2xl font-black text-navy-800">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminHome() {
  const user = await requireRole(ADMIN_ROLES);

  const [byStatus, owners, clients, agents, visits, pendingVisits, recent] = await Promise.all([
    prisma.property.groupBy({ by: ["status"], _count: true }),
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.visit.count(),
    prisma.visit.count({ where: { status: { in: ["REQUESTED", "CONFIRMED"] } } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { actor: { select: { name: true } } },
    }),
  ]);
  const c = (s: string) => byStatus.find((r) => r.status === s)?._count ?? 0;

  return (
    <DashboardShell area="admin" role={user.role} title="Tableau de bord PHANY">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi label="Biens publiés" value={c("PUBLISHED")} href="/admin/properties?status=PUBLISHED" />
        <Kpi
          label="En attente"
          value={c("PENDING") + c("VERIFIED")}
          href="/admin/properties?status=PENDING"
        />
        <Kpi label="À corriger" value={c("NEEDS_FIX")} href="/admin/properties?status=NEEDS_FIX" />
        <Kpi label="Loués" value={c("RENTED")} />
        <Kpi label="Vendus" value={c("SOLD")} />
        <Kpi label="Propriétaires" value={owners} href="/admin/users?role=OWNER" />
        <Kpi label="Clients" value={clients} href="/admin/users?role=CLIENT" />
        <Kpi label="Agents" value={agents} href="/admin/users?role=AGENT" />
        <Kpi label="Visites (total)" value={visits} href="/admin/visits" />
        <Kpi label="Visites à traiter" value={pendingVisits} href="/admin/visits" />
      </div>

      <h2 className="mb-3 mt-8 font-semibold text-navy-800">Activité récente</h2>
      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
        <table className="w-full text-sm">
          <tbody>
            {recent.map((log) => (
              <tr key={log.id} className="border-b border-navy-100 last:border-0">
                <td className="p-3 font-mono text-xs text-muted">
                  {log.createdAt.toLocaleString("fr-FR")}
                </td>
                <td className="p-3">{log.actor?.name ?? "—"}</td>
                <td className="p-3 font-medium text-navy-700">{log.action}</td>
                <td className="p-3 text-muted">
                  {log.entity}
                  {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td className="p-4 text-center text-sm text-muted">Aucune activité.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
