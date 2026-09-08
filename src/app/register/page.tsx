import { redirect } from "next/navigation";
import { getCurrentUser, homePathForRole } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Créer un compte" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathForRole(user.role));

  return (
    <AuthShell title="Créer un compte" subtitle="Client ou propriétaire, en 30 secondes.">
      <RegisterForm />
    </AuthShell>
  );
}
