import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Role } from "@prisma/client";
import { getCurrentUser, type CurrentUser } from "./auth";

export function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Enveloppe une route API : gère ZodError et erreurs connues proprement. */
export function route<T>(handler: () => Promise<T>) {
  return handler().catch((err: unknown) => {
    if (err instanceof ZodError) {
      return fail("Données invalides", 422, {
        issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    if (err instanceof HttpError) {
      return fail(err.message, err.status);
    }
    console.error("[api] erreur non gérée:", err);
    return fail("Erreur interne", 500);
  }) as Promise<T | NextResponse>;
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Exige une session valide, sinon 401. */
export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError("Authentification requise", 401);
  return user;
}

/** Exige un rôle précis, sinon 403. */
export async function requireApiRole(roles: Role[]): Promise<CurrentUser> {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) throw new HttpError("Accès refusé", 403);
  return user;
}

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}
