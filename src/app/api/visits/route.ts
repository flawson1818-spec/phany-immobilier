import { route, ok, fail, HttpError, requireApiUser, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { visitRequestSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

// Liste des visites pertinentes pour l'utilisateur courant.
export async function GET() {
  return route(async () => {
    const user = await requireApiUser();
    const where = isAdmin(user.role)
      ? {}
      : user.role === "OWNER"
        ? { property: { ownerId: user.id } }
        : { clientId: user.id };

    const visits = await prisma.visit.findMany({
      where,
      include: {
        property: { select: { id: true, reference: true, title: true, district: true, city: true } },
        client: { select: { name: true, phone: true } },
        agent: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(visits.map((v) => ({ ...v, feeAmount: v.feeAmount?.toString() ?? null })));
  });
}

// Un client demande une visite.
export async function POST(req: Request) {
  return route(async () => {
    const user = await requireApiUser();
    if (!rateLimit(`visit:${user.id}`, 10, 60 * 60 * 1000).ok) {
      return fail("Trop de demandes de visite. Réessayez plus tard.", 429);
    }

    const { propertyId, preferredAt, note } = visitRequestSchema.parse(await req.json());
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.status !== "PUBLISHED") {
      throw new HttpError("Ce bien n'est pas disponible à la visite.", 404);
    }
    if (property.ownerId === user.id) {
      return fail("Vous ne pouvez pas demander à visiter votre propre bien.", 409);
    }

    const existing = await prisma.visit.findFirst({
      where: { propertyId, clientId: user.id, status: { in: ["REQUESTED", "CONFIRMED", "ASSIGNED"] } },
    });
    if (existing) return fail("Vous avez déjà une demande de visite en cours pour ce bien.", 409);

    const visit = await prisma.visit.create({
      data: {
        propertyId,
        clientId: user.id,
        scheduledAt: preferredAt ?? null,
        note: note ?? null,
        status: "REQUESTED",
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "visit.request",
      entity: "Visit",
      entityId: visit.id,
      ip: getClientIp(req),
    });

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        notify({
          userId: a.id,
          type: "VISIT_STATUS",
          title: "Nouvelle demande de visite",
          body: `${property.reference} — ${property.title}`,
          link: "/admin/visits",
        }),
      ),
    );

    return ok({ ...visit, feeAmount: null }, 201);
  });
}
