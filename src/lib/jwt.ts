import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

// Pure JWT helpers — pas d'import next/headers ici pour rester compatible
// avec le runtime Edge (middleware).

export const SESSION_COOKIE_NAME = "phany_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET manquant ou trop court (min. 32 caractères recommandés).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      name: (payload.name as string) ?? "",
    };
  } catch {
    return null;
  }
}
