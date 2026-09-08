import { route, ok, requireApiRole } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/auth";

export async function GET() {
  return route(async () => {
    await requireApiRole(ADMIN_ROLES);

    const [byStatus, owners, clients, agents, visits, pendingVisits] = await Promise.all([
      prisma.property.groupBy({ by: ["status"], _count: true }),
      prisma.user.count({ where: { role: "OWNER" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.user.count({ where: { role: "AGENT" } }),
      prisma.visit.count(),
      prisma.visit.count({ where: { status: { in: ["REQUESTED", "CONFIRMED"] } } }),
    ]);

    const count = (s: string) => byStatus.find((r) => r.status === s)?._count ?? 0;

    return ok({
      properties: {
        published: count("PUBLISHED"),
        pending: count("PENDING") + count("VERIFIED"),
        needsFix: count("NEEDS_FIX"),
        rented: count("RENTED"),
        sold: count("SOLD"),
        archived: count("ARCHIVED"),
        total: byStatus.reduce((s, r) => s + r._count, 0),
      },
      users: { owners, clients, agents },
      visits: { total: visits, pending: pendingVisits },
    });
  });
}
