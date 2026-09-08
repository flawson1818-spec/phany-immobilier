"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PropertyStatus } from "@prisma/client";
import { Button } from "./ui";

const ACTIONS: Record<string, { label: string; variant: "primary" | "gold" | "bordeaux" | "outline"; needNote?: boolean }> = {
  verify: { label: "Vérifier", variant: "outline" },
  publish: { label: "Publier", variant: "primary" },
  needs_fix: { label: "Demander correction", variant: "gold", needNote: true },
  reject: { label: "Refuser", variant: "bordeaux", needNote: true },
  archive: { label: "Archiver", variant: "outline" },
  unpublish: { label: "Dépublier", variant: "outline" },
};

const AVAILABLE: Record<PropertyStatus, string[]> = {
  DRAFT: [],
  PENDING: ["verify", "publish", "needs_fix", "reject"],
  NEEDS_FIX: ["reject"],
  VERIFIED: ["publish", "needs_fix", "reject"],
  PUBLISHED: ["unpublish", "archive"],
  RESERVED: ["publish", "archive"],
  RENTED: ["archive"],
  SOLD: ["archive"],
  ARCHIVED: ["publish"],
  REJECTED: ["needs_fix"],
};

export function ModerationActions({ id, status }: { id: string; status: PropertyStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: string) {
    let reviewNote: string | undefined;
    if (ACTIONS[action].needNote) {
      reviewNote = window.prompt("Motif communiqué au propriétaire :") ?? undefined;
      if (!reviewNote) return;
    }
    start(async () => {
      setError(null);
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Action impossible");
        return;
      }
      router.refresh();
    });
  }

  const actions = AVAILABLE[status] ?? [];
  if (actions.length === 0) return <span className="text-xs text-muted">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <Button
          key={a}
          variant={ACTIONS[a].variant}
          disabled={pending}
          className="!px-2.5 !py-1 !text-xs"
          onClick={() => run(a)}
        >
          {ACTIONS[a].label}
        </Button>
      ))}
      {error && <span className="w-full text-xs text-bordeaux-600">{error}</span>}
    </div>
  );
}
