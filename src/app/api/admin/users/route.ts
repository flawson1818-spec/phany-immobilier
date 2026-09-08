import type { Prisma } from "@prisma/client";
import { route, ok, requireApiRole } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  return route(async () => {
    await requireApiRole(["ADMIN", "SUPER_ADMIN"]);
    const role = new URL(req.url).searchParams.get("role");
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as Prisma.UserWhereInput["role"];

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
    return ok(users);
  });
}
