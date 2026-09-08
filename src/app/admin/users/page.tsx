import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";
import { UserAdminActions } from "@/components/UserAdminActions";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const ROLE_TABS: (Role | "ALL")[] = ["ALL", "CLIENT", "OWNER", "AGENT", "ADMIN"];

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { role } = await searchParams;

  const where: Prisma.UserWhereInput = {};
  if (role && role !== "ALL") where.role = role as Role;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { properties: true, visitsAsClient: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <DashboardShell area="admin" role={admin.role} title="Utilisateurs">
      <div className="mb-4 flex flex-wrap gap-2">
        {ROLE_TABS.map((r) => (
          <Link
            key={r}
            href={r === "ALL" ? "/admin/users" : `/admin/users?role=${r}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              (role ?? "ALL") === r ? "bg-navy-700 text-white" : "border border-navy-100 bg-white text-navy-700"
            }`}
          >
            {r}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Nom</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Inscrit</th>
              <th className="p-3">Activité</th>
              <th className="p-3">Rôle / Statut</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-navy-100">
                <td className="p-3 font-medium text-navy-800">
                  {u.name}
                  {u.id === admin.id && <span className="ml-1 text-xs text-muted">(vous)</span>}
                </td>
                <td className="p-3 text-muted">
                  {u.email}
                  <br />
                  {u.phone ?? "—"}
                </td>
                <td className="p-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="p-3 text-muted">
                  {u._count.properties} bien(s) · {u._count.visitsAsClient} visite(s)
                </td>
                <td className="p-3">
                  {u.id === admin.id ? (
                    <span className="text-xs text-muted">{u.role}</span>
                  ) : (
                    <UserAdminActions
                      id={u.id}
                      role={u.role}
                      isActive={u.isActive}
                      canManageAdmins={admin.role === "SUPER_ADMIN"}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
