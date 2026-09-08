import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/jwt";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "AGENT"]);

// Préfixes protégés et rôles autorisés.
const RULES: { prefix: string; allow: (role: string) => boolean }[] = [
  { prefix: "/admin", allow: (r) => ADMIN_ROLES.has(r) },
  { prefix: "/owner", allow: (r) => r === "OWNER" || ADMIN_ROLES.has(r) },
  { prefix: "/client", allow: (r) => r === "CLIENT" || ADMIN_ROLES.has(r) },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.allow(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*", "/client/:path*"],
};
