import { route, ok, fail, HttpError, requireApiUser, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { propertyUpdateSchema } from "@/lib/validation";
import { OWNER_EDITABLE_STATUSES } from "@/lib/property";
import { writeAudit } from "@/lib/audit";
import { deletePropertyImage } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

async function loadOwned(id: string, userId: string, role: string) {
  const property = await prisma.property.findUnique({ where: { id }, include: { images: true } });
  if (!property) throw new HttpError("Bien introuvable", 404);
  if (property.ownerId !== userId && !isAdmin(role as never)) {
    throw new HttpError("Accès refusé", 403);
  }
  return property;
}

export async function GET(_req: Request, { params }: Params) {
  return route(async () => {
    const { id } = await params;
    const user = await requireApiUser();
    const property = await loadOwned(id, user.id, user.role);
    return ok({ ...property, price: property.price.toString() });
  });
}

export async function PATCH(req: Request, { params }: Params) {
  return route(async () => {
    const { id } = await params;
    const user = await requireApiUser();
    const property = await loadOwned(id, user.id, user.role);

    const owns = property.ownerId === user.id;
    if (owns && !isAdmin(user.role) && !OWNER_EDITABLE_STATUSES.includes(property.status as never)) {
      return fail(
        "Ce bien est en cours de traitement par PHANY et ne peut plus être modifié directement.",
        409,
      );
    }

    const data = propertyUpdateSchema.parse(await req.json());
    const updated = await prisma.property.update({
      where: { id },
      data: { ...data, address: data.address === "" ? null : data.address },
    });

    await writeAudit({
      actorId: user.id,
      action: "property.update",
      entity: "Property",
      entityId: id,
      ip: getClientIp(req),
    });

    return ok({ ...updated, price: updated.price.toString() });
  });
}

export async function DELETE(req: Request, { params }: Params) {
  return route(async () => {
    const { id } = await params;
    const user = await requireApiUser();
    const property = await loadOwned(id, user.id, user.role);

    if (property.ownerId === user.id && !isAdmin(user.role) && property.status === "PUBLISHED") {
      return fail("Un bien publié ne peut pas être supprimé. Demandez son archivage à PHANY.", 409);
    }

    await Promise.all(property.images.map((img) => img.path && deletePropertyImage(img.path)));
    await prisma.property.delete({ where: { id } });

    await writeAudit({
      actorId: user.id,
      action: "property.delete",
      entity: "Property",
      entityId: id,
      ip: getClientIp(req),
    });

    return ok({ ok: true });
  });
}
