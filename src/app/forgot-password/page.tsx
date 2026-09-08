import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/AuthForms";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Recevez un lien pour définir un nouveau mot de passe."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
