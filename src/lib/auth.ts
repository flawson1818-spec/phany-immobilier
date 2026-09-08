import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { readSession } from "./session";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Utilisateur courant (ou null). Mise en cache par requête. */
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "AGENT"];

export function isAdmin(role: Role) {
  return ADMIN_ROLES.includes(role);
}

export function homePathForRole(role: Role) {
  if (role === "OWNER") return "/owner";
  if (role === "CLIENT") return "/client";
  return "/admin";
}
