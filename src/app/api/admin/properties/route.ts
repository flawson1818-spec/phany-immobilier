import type { Prisma } from "@prisma/client";
import { route, ok, requireApiRole } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/auth";

export async function GET(req: Request) {
  return route(async () => {
    await requireApiRole(ADMIN_ROLES);
    const status = new URL(req.url).searchParams.get("status");
    const where: Prisma.PropertyWhereInput = {};
    if (status) where.status = status as Prisma.PropertyWhereInput["status"];

    const rows = await prisma.property.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        _count: { select: { visits: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    });
    return ok(rows.map((r) => ({ ...r, price: r.price.toString() })));
  });
}
