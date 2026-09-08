import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, homePathForRole } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathForRole(user.role));

  return (
    <AuthShell title="Connexion" subtitle="Accédez à votre espace PHANY.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
