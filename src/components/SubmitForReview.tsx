"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Alert } from "./ui";

export function SubmitForReview({
  propertyId,
  canSubmit,
  hint,
}: {
  propertyId: string;
  canSubmit: boolean;
  hint: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2 rounded-2xl border border-navy-100 bg-white p-5">
      <h3 className="font-semibold text-navy-800">Soumettre à PHANY</h3>
      <p className="text-sm text-muted">{hint}</p>
      {error && <Alert tone="error">{error}</Alert>}
      <Button
        variant="gold"
        disabled={!canSubmit || pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await fetch(`/api/properties/${propertyId}/submit`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) {
              setError(json.error ?? "Soumission impossible");
              return;
            }
            router.refresh();
          })
        }
      >
        {pending ? "Envoi…" : "Soumettre pour vérification"}
      </Button>
    </div>
  );
}
