import { route, ok, fail, HttpError, requireApiRole } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

// Le propriétaire soumet son bien pour vérification PHANY : -> PENDING
export async function POST(_req: Request, { params }: Params) {
  return route(async () => {
    const { id } = await params;
    const user = await requireApiRole(["OWNER", "ADMIN", "SUPER_ADMIN"]);

    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!property) throw new HttpError("Bien introuvable", 404);
    if (property.ownerId !== user.id && user.role === "OWNER") {
      throw new HttpError("Accès refusé", 403);
    }
    if (!["DRAFT", "NEEDS_FIX", "REJECTED"].includes(property.status)) {
      return fail("Ce bien a déjà été soumis.", 409);
    }
    if (property.images.length === 0) {
      return fail("Ajoutez au moins une photo avant de soumettre.", 422);
    }

    await prisma.property.update({
      where: { id },
      data: { status: "PENDING", reviewNote: null },
    });

    await writeAudit({ actorId: user.id, action: "property.submit", entity: "Property", entityId: id });

    // Notifie les admins (best-effort).
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        notify({
          userId: a.id,
          type: "PROPERTY_STATUS",
          title: "Nouveau bien à vérifier",
          body: `${property.reference} — ${property.title}`,
          link: `/admin/properties`,
        }),
      ),
    );

    return ok({ ok: true, status: "PENDING" });
  });
}
