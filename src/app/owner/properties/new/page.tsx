import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { PropertyForm } from "@/components/PropertyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajouter un bien" };

export default async function NewPropertyPage() {
  const user = await requireRole(["OWNER", "ADMIN", "SUPER_ADMIN"]);
  return (
    <DashboardShell area="owner" role={user.role} title="Ajouter un bien">
      <p className="mb-4 text-sm text-muted">
        Étape 1 : renseignez les informations. Étape 2 : ajoutez des photos. Étape 3 : soumettez à
        PHANY pour vérification.
      </p>
      <PropertyForm />
    </DashboardShell>
  );
}
