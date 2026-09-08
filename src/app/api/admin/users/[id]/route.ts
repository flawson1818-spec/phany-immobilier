import { route, ok, fail, HttpError, requireApiRole, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { adminUserUpdateSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  return route(async () => {
    const admin = await requireApiRole(["ADMIN", "SUPER_ADMIN"]);
    const { id } = await params;
    const data = adminUserUpdateSchema.parse(await req.json());

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError("Utilisateur introuvable", 404);

    if (target.id === admin.id) return fail("Vous ne pouvez pas modifier votre propre compte ici.", 409);
    if (target.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return fail("Seul un super-admin peut modifier un super-admin.", 403);
    }
    if (data.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return fail("Seul un super-admin peut nommer un super-admin.", 403);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: data.role, isActive: data.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await writeAudit({
      actorId: admin.id,
      action: "user.update",
      entity: "User",
      entityId: id,
      meta: data as Record<string, unknown>,
      ip: getClientIp(req),
    });

    return ok(updated);
  });
}
