import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/DashboardShell";
import { PropertyForm } from "@/components/PropertyForm";
import { ImageUploader } from "@/components/ImageUploader";
import { SubmitForReview } from "@/components/SubmitForReview";
import { PropertyStatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/ui";
import { OWNER_EDITABLE_STATUSES } from "@/lib/property";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["OWNER", "ADMIN", "SUPER_ADMIN"]);

  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
  });
  if (!property) notFound();
  if (property.ownerId !== user.id && !isAdmin(user.role)) notFound();

  const editable = OWNER_EDITABLE_STATUSES.includes(property.status as never) || isAdmin(user.role);
  const canSubmit = ["DRAFT", "NEEDS_FIX", "REJECTED"].includes(property.status) && property.images.length > 0;

  return (
    <DashboardShell area="owner" role={user.role} title={property.title}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <PropertyStatusBadge status={property.status} />
        <span className="font-mono text-xs text-muted">{property.reference}</span>
        {property.status === "PUBLISHED" && (
          <Link href={`/properties/${property.id}`} className="text-sm font-medium text-bordeaux-600">
            Voir l&apos;annonce publique →
          </Link>
        )}
      </div>

      {property.reviewNote && ["NEEDS_FIX", "REJECTED"].includes(property.status) && (
        <div className="mb-4">
          <Alert tone="error">
            <strong>PHANY :</strong> {property.reviewNote}
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {editable ? (
            <PropertyForm
              initial={{
                id: property.id,
                title: property.title,
                type: property.type,
                operation: property.operation,
                price: property.price.toString(),
                city: property.city,
                district: property.district,
                address: property.address ?? "",
                surface: property.surface?.toString() ?? "",
                bedrooms: property.bedrooms?.toString() ?? "",
                bathrooms: property.bathrooms?.toString() ?? "",
                furnished: property.furnished,
                features: property.features.join(", "),
                description: property.description,
              }}
            />
          ) : (
            <Alert tone="info">
              Ce bien est en cours de traitement par PHANY. Il ne peut plus être modifié
              directement. Contactez PHANY pour toute correction.
            </Alert>
          )}
        </div>

        <div className="space-y-6">
          <ImageUploader propertyId={property.id} initial={property.images} />
          {["DRAFT", "NEEDS_FIX", "REJECTED"].includes(property.status) && (
            <SubmitForReview
              propertyId={property.id}
              canSubmit={canSubmit}
              hint={
                property.images.length === 0
                  ? "Ajoutez au moins une photo pour pouvoir soumettre."
                  : "Votre bien sera vérifié par l'équipe PHANY avant publication."
              }
            />
          )}
          {property.status === "PENDING" && (
            <Alert tone="info">En attente de vérification par PHANY.</Alert>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
