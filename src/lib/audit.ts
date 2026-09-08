import "server-only";
import { prisma } from "./prisma";

type AuditInput = {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
};

/** Écrit une entrée d'audit. Ne jette jamais (best-effort). */
export async function writeAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        meta: (input.meta ?? undefined) as never,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] échec écriture:", err);
  }
}
