import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/AuthForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Réinitialiser le mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell title="Nouveau mot de passe">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-muted">
          Lien invalide.{" "}
          <Link href="/forgot-password" className="font-medium text-bordeaux-600">
            Demander un nouveau lien
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
