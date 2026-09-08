import crypto from "crypto";
import { route, ok, fail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  return route(async () => {
    const { token, password } = resetPasswordSchema.parse(await req.json());
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return fail("Lien invalide ou expiré. Refaites une demande.", 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalide les autres tokens éventuels.
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    await writeAudit({
      actorId: record.userId,
      action: "auth.password_reset",
      entity: "User",
      entityId: record.userId,
    });

    return ok({ ok: true });
  });
}
