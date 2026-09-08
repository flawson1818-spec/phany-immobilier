import { route, ok, fail, getClientIp } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPassword, homePathForRole } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  return route(async () => {
    const ip = getClientIp(req);
    if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000).ok) {
      return fail("Trop de tentatives de connexion. Réessayez dans quelques minutes.", 429);
    }

    const { email, password } = loginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });

    // Message générique + comparaison même si l'utilisateur n'existe pas (anti-énumération).
    const hash = user?.passwordHash ?? "$2a$12$0000000000000000000000000000000000000000000000000000";
    const valid = await verifyPassword(password, hash);

    if (!user || !valid || !user.isActive) {
      return fail("Email ou mot de passe incorrect.", 401);
    }

    await createSession({ sub: user.id, role: user.role, name: user.name });
    return ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      redirect: homePathForRole(user.role),
    });
  });
}
