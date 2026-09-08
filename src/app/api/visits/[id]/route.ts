import type { VisitStatus } from "@prisma/client";
import { route, ok, fail, HttpError, requireApiUser, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { visitUpdateSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

const NEXT: Record<string, VisitStatus> = {
  confirm: "CONFIRMED",
  assign: "ASSIGNED",
  complete: "COMPLETED",
  cancel: "CANCELLED",
};

export async function PATCH(req: Request, { params }: Params) {
  return route(async () => {
    const user = await requireApiUser();
    const { id } = await params;
    const body = visitUpdateSchema.parse(await req.json());

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { property: { select: { ownerId: true, reference: true, title: true } } },
    });
    if (!visit) throw new HttpError("Visite introuvable", 404);

    const isClient = visit.clientId === user.id;
    const admin = isAdmin(user.role);

    // Le client ne peut qu'annuler sa propre demande.
    if (!admin && !(isClient && body.action === "cancel")) {
      throw new HttpError("Accès refusé", 403);
    }

    if (body.action === "assign") {
      if (!body.agentId) return fail("agentId requis pour affecter un agent.", 422);
      const agent = await prisma.user.findFirst({
        where: { id: body.agentId, role: { in: ["AGENT", "ADMIN", "SUPER_ADMIN"] } },
      });
      if (!agent) return fail("Agent invalide.", 422);
    }

    const updated = await prisma.visit.update({
      where: { id },
      data: {
        status: NEXT[body.action],
        agentId: body.action === "assign" ? body.agentId : visit.agentId,
        scheduledAt: body.scheduledAt ?? visit.scheduledAt,
        completedAt: body.action === "complete" ? new Date() : visit.completedAt,
        note: body.note ?? visit.note,
      },
    });

    await writeAudit({
      actorId: user.id,
      action: `visit.${body.action}`,
      entity: "Visit",
      entityId: id,
      ip: getClientIp(req),
    });

    // Notifie le client des changements côté PHANY.
    if (admin) {
      await notify({
        userId: visit.clientId,
        type: "VISIT_STATUS",
        title: `Visite ${NEXT[body.action] === "CONFIRMED" ? "confirmée" : NEXT[body.action] === "ASSIGNED" ? "planifiée" : NEXT[body.action] === "COMPLETED" ? "terminée" : "annulée"}`,
        body: `${visit.property.reference} — ${visit.property.title}`,
        link: "/client",
      });
    }

    return ok({ ...updated, feeAmount: updated.feeAmount?.toString() ?? null });
  });
}
