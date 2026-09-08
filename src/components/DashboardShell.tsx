import Link from "next/link";
import type { Role } from "@prisma/client";
import { Brand } from "./Brand";
import { LogoutButton } from "./LogoutButton";

type NavItem = { href: string; label: string };

const NAV: Record<"owner" | "client" | "admin", NavItem[]> = {
  owner: [
    { href: "/owner", label: "Mes biens" },
    { href: "/owner/properties/new", label: "Ajouter un bien" },
    { href: "/owner/visits", label: "Demandes de visite" },
  ],
  client: [
    { href: "/client", label: "Mon espace" },
    { href: "/client/favorites", label: "Mes favoris" },
    { href: "/", label: "Rechercher" },
  ],
  admin: [
    { href: "/admin", label: "Tableau de bord" },
    { href: "/admin/properties", label: "Annonces" },
    { href: "/admin/visits", label: "Visites" },
    { href: "/admin/users", label: "Utilisateurs" },
  ],
};

export function DashboardShell({
  area,
  role,
  title,
  children,
}: {
  area: "owner" | "client" | "admin";
  role: Role;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Brand />
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-muted sm:block">
              {role}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row">
        <nav className="flex gap-2 overflow-x-auto sm:w-52 sm:flex-col sm:overflow-visible">
          {NAV[area].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1">
          <h1 className="text-2xl font-bold text-navy-800">{title}</h1>
          <div className="mt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
