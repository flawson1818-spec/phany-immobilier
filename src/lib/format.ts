const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** Formate un montant en FCFA : 250000 -> "250 000 FCFA". */
export function formatPrice(value: number | string | { toString(): string }, currency = "FCFA") {
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return `— ${currency}`;
  return `${fcfa.format(n)} ${currency}`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
