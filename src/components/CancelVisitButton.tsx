"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function CancelVisitButton({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="text-xs font-medium text-bordeaux-600 hover:underline disabled:opacity-50"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch(`/api/visits/${visitId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel" }),
          });
          router.refresh();
        })
      }
    >
      {pending ? "…" : "Annuler"}
    </button>
  );
}
