import { route, ok, fail, HttpError, requireApiUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { uploadPropertyImage, deletePropertyImage } from "@/lib/storage";
import { MAX_IMAGES_PER_PROPERTY } from "@/lib/constants";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

async function assertCanEdit(propertyId: string, userId: string, role: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!property) throw new HttpError("Bien introuvable", 404);
  if (property.ownerId !== userId && !isAdmin(role as never)) {
    throw new HttpError("Accès refusé", 403);
  }
  return property;
}

// Upload d'une ou plusieurs photos (multipart/form-data, champ "files").
export async function POST(req: Request, { params }: Params) {
  return route(async () => {
    const { id } = await params;
    const user = await requireApiUser();
    const property = await assertCanEdit(id, user.id, user.role);

    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) return fail("Aucun fichier reçu.", 422);
    if (property.images.length + files.length > MAX_IMAGES_PER_PROPERTY) {
      return fail(`Maximum ${MAX_IMAGES_PER_PROPERTY} photos par bien.`, 422);
    }

    const created = [];
    let order = property.images.length;
    for (const file of files) {
      const stored = await uploadPropertyImage(id, file);
      const image = await prisma.propertyImage.create({
        data: {
          propertyId: id,
          url: stored.url,
          path: stored.path,
          sortOrder: order,
          isPrimary: property.images.length === 0 && order === 0,
        },
      });
      created.push(image);
      order += 1;
    }

    await writeAudit({ actorId: user.id, action: "property.images.add", entity: "Property", entityId: id });
    return ok({ images: created }, 201);
  });
}

// Réordonner / définir l'image principale.
export async function PATCH(req: Request, { params }: Params) {
  return route(async () => {
    const { id } = await params;
    const user = await requireApiUser();
    await assertCanEdit(id, user.id, user.role);

    const body = (await req.json()) as { order?: string[]; primaryId?: string };

    if (Array.isArray(body.order)) {
      await prisma.$transaction(
        body.order.map((imgId, index) =>
          prisma.propertyImage.updateMany({
            where: { id: imgId, propertyId: id },
            data: { sortOrder: index },
          }),
        ),
      );
    }

    if (body.primaryId) {
      await prisma.$transaction([
        prisma.propertyImage.updateMany({ where: { propertyId: id }, data: { isPrimary: false } }),
        prisma.propertyImage.updateMany({
          where: { id: body.primaryId, propertyId: id },
          data: { isPrimary: true },
        }),
      ]);
    }

    const images = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });
    return ok({ images });
  });
}

// Supprimer une photo : /api/properties/:id/images?imageId=xxx
export async function DELETE(req: Request, { params }: Params) {
  return route(async () => {
    const { id } = await params;
    const user = await requireApiUser();
    await assertCanEdit(id, user.id, user.role);

    const imageId = new URL(req.url).searchParams.get("imageId");
    if (!imageId) return fail("imageId requis", 422);

    const image = await prisma.propertyImage.findFirst({ where: { id: imageId, propertyId: id } });
    if (!image) return fail("Photo introuvable", 404);

    if (image.path) await deletePropertyImage(image.path);
    await prisma.propertyImage.delete({ where: { id: imageId } });

    // Réattribue une image principale si besoin.
    if (image.isPrimary) {
      const next = await prisma.propertyImage.findFirst({
        where: { propertyId: id },
        orderBy: { sortOrder: "asc" },
      });
      if (next) await prisma.propertyImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    return ok({ ok: true });
  });
}
