import Link from "next/link";
import { getCurrentUser, homePathForRole } from "@/lib/auth";
import { Brand } from "./Brand";
import { ButtonLink } from "./ui";
import { LogoutButton } from "./LogoutButton";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="flex items-center gap-4">
          <Link href="/properties" className="hidden text-sm font-medium text-navy-700 sm:block">
            Annonces
          </Link>
          {user ? (
            <>
              <ButtonLink href={homePathForRole(user.role)} variant="outline" className="!py-2">
                Mon espace
              </ButtonLink>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-navy-700">
                Connexion
              </Link>
              <ButtonLink href="/register" variant="gold" className="!py-2">
                Créer un compte
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
