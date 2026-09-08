import type { PropertyStatus, VisitStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/constants";
import { Badge } from "./ui";

const PROP_TONE: Record<PropertyStatus, "navy" | "gold" | "bordeaux" | "green" | "gray"> = {
  DRAFT: "gray",
  PENDING: "gold",
  NEEDS_FIX: "bordeaux",
  VERIFIED: "navy",
  PUBLISHED: "green",
  RESERVED: "gold",
  RENTED: "navy",
  SOLD: "navy",
  ARCHIVED: "gray",
  REJECTED: "bordeaux",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge tone={PROP_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
}

const VISIT_LABELS: Record<VisitStatus, string> = {
  REQUESTED: "Demandée",
  CONFIRMED: "Confirmée",
  ASSIGNED: "Agent affecté",
  COMPLETED: "Effectuée",
  CANCELLED: "Annulée",
};

const VISIT_TONE: Record<VisitStatus, "navy" | "gold" | "bordeaux" | "green" | "gray"> = {
  REQUESTED: "gold",
  CONFIRMED: "navy",
  ASSIGNED: "navy",
  COMPLETED: "green",
  CANCELLED: "gray",
};

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return <Badge tone={VISIT_TONE[status]}>{VISIT_LABELS[status]}</Badge>;
}
