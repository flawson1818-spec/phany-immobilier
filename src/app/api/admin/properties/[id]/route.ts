import type { PropertyStatus } from "@prisma/client";
import { route, ok, fail, HttpError, requireApiRole, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/auth";
import { adminPropertyActionSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

const NEXT_STATUS: Record<string, PropertyStatus> = {
  verify: "VERIFIED",
  publish: "PUBLISHED",
  reject: "REJECTED",
  needs_fix: "NEEDS_FIX",
  archive: "ARCHIVED",
  unpublish: "VERIFIED",
};

const NOTIFY_LABEL: Record<string, string> = {
  verify: "Votre bien a été vérifié par PHANY.",
  publish: "Votre bien est maintenant publié 🎉",
  reject: "Votre bien a été refusé.",
  needs_fix: "PHANY demande une correction sur votre bien.",
  archive: "Votre bien a été archivé.",
  unpublish: "Votre bien a été dépublié.",
};

export async function PATCH(req: Request, { params }: Params) {
  return route(async () => {
    const admin = await requireApiRole(ADMIN_ROLES);
    const { id } = await params;
    const { action, reviewNote } = adminPropertyActionSchema.parse(await req.json());

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new HttpError("Bien introuvable", 404);

    if ((action === "reject" || action === "needs_fix") && !reviewNote) {
      return fail("Un motif est requis pour refuser ou demander une correction.", 422);
    }

    const status = NEXT_STATUS[action];
    const updated = await prisma.property.update({
      where: { id },
      data: {
        status,
        reviewNote: reviewNote ?? null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        publishedAt:
          action === "publish" ? property.publishedAt ?? new Date() : property.publishedAt,
      },
    });

    await writeAudit({
      actorId: admin.id,
      action: `property.${action}`,
      entity: "Property",
      entityId: id,
      meta: reviewNote ? { reviewNote } : undefined,
      ip: getClientIp(req),
    });

    await notify({
      userId: property.ownerId,
      type: "PROPERTY_STATUS",
      title: NOTIFY_LABEL[action],
      body: `${property.reference} — ${property.title}${reviewNote ? `\nMotif : ${reviewNote}` : ""}`,
      link: "/owner",
    });

    return ok({ ...updated, price: updated.price.toString() });
  });
}
