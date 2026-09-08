import crypto from "crypto";
import { route, ok, fail, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

export async function POST(req: Request) {
  return route(async () => {
    const ip = getClientIp(req);
    if (!rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000).ok) {
      return fail("Trop de demandes. Réessayez plus tard.", 429);
    }

    const { email } = forgotPasswordSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });

    // Réponse identique que le compte existe ou non (anti-énumération).
    if (user) {
      const raw = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
      });

      const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const link = `${base}/reset-password?token=${raw}`;
      const mail = passwordResetEmail(link);
      await sendEmail({ to: user.email, ...mail });
    }

    return ok({ ok: true });
  });
}
