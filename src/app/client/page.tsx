import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";
import { VisitStatusBadge } from "@/components/StatusBadge";
import { CancelVisitButton } from "@/components/CancelVisitButton";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientHome() {
  const user = await requireRole(["CLIENT", "ADMIN", "SUPER_ADMIN"]);

  const [visits, favCount] = await Promise.all([
    prisma.visit.findMany({
      where: { clientId: user.id },
      include: {
        property: { select: { id: true, reference: true, title: true, district: true, city: true } },
        agent: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.count({ where: { userId: user.id } }),
  ]);

  return (
    <DashboardShell area="client" role={user.role} title={`Bonjour ${user.name}`}>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link href="/" className="rounded-xl border border-navy-100 bg-white p-4 hover:shadow-md">
          <div className="text-2xl font-black text-navy-800">🔎</div>
          <div className="mt-1 text-sm font-semibold">Rechercher un bien</div>
          <div className="text-xs text-muted">avec PHANY AI</div>
        </Link>
        <Link href="/client/favorites" className="rounded-xl border border-navy-100 bg-white p-4 hover:shadow-md">
          <div className="text-2xl font-black text-bordeaux-600">{favCount}</div>
          <div className="mt-1 text-sm font-semibold">Favoris</div>
        </Link>
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <div className="text-2xl font-black text-navy-800">{visits.length}</div>
          <div className="mt-1 text-sm font-semibold">Demandes de visite</div>
        </div>
      </div>

      <h2 className="mb-3 font-semibold text-navy-800">Mes visites</h2>
      {visits.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-100 bg-white p-8 text-center text-sm text-muted">
          Aucune visite demandée. Trouvez un bien et demandez une visite.
        </p>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v.id} className="rounded-xl border border-navy-100 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/properties/${v.property.id}`} className="font-semibold text-navy-800">
                  {v.property.title}
                </Link>
                <VisitStatusBadge status={v.status} />
              </div>
              <div className="mt-1 text-xs text-muted">
                {v.property.district}, {v.property.city} · {v.property.reference}
              </div>
              <div className="mt-1 text-xs text-muted">
                {v.scheduledAt ? `RDV : ${formatDateTime(v.scheduledAt)}` : "Date à confirmer"}
                {v.agent ? ` · Agent : ${v.agent.name}` : ""}
              </div>
              {["REQUESTED", "CONFIRMED"].includes(v.status) && (
                <div className="mt-2">
                  <CancelVisitButton visitId={v.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
