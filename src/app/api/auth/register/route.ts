import { route, ok, fail, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword, homePathForRole } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { registerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  return route(async () => {
    const ip = getClientIp(req);
    if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000).ok) {
      return fail("Trop de tentatives. Réessayez plus tard.", 429);
    }

    const data = registerSchema.parse(await req.json());
    const email = data.email;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail("Un compte existe déjà avec cet email.", 409);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone || null,
        passwordHash: await hashPassword(data.password),
        role: data.role,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await createSession({ sub: user.id, role: user.role, name: user.name });
    await writeAudit({ actorId: user.id, action: "auth.register", entity: "User", entityId: user.id, ip });

    return ok({ user, redirect: homePathForRole(user.role) }, 201);
  });
}
