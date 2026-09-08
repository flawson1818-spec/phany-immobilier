"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VisitStatus } from "@prisma/client";
import { Button } from "./ui";

export function VisitAdminActions({
  id,
  status,
  agents,
}: {
  id: string;
  status: VisitStatus;
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [when, setWhen] = useState("");

  function run(action: string, extra?: Record<string, unknown>) {
    start(async () => {
      await fetch(`/api/visits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      router.refresh();
    });
  }

  if (status === "COMPLETED" || status === "CANCELLED") {
    return <span className="text-xs text-muted">Clôturée</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "REQUESTED" && (
        <Button variant="primary" className="!px-2.5 !py-1 !text-xs" disabled={pending} onClick={() => run("confirm")}>
          Confirmer
        </Button>
      )}
      {(status === "CONFIRMED" || status === "ASSIGNED") && (
        <>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="rounded border border-navy-100 px-2 py-1 text-xs"
          />
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="rounded border border-navy-100 px-2 py-1 text-xs"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <Button
            variant="gold"
            className="!px-2.5 !py-1 !text-xs"
            disabled={pending || !agentId}
            onClick={() => run("assign", { agentId, scheduledAt: when || undefined })}
          >
            Affecter
          </Button>
          <Button variant="outline" className="!px-2.5 !py-1 !text-xs" disabled={pending} onClick={() => run("complete")}>
            Terminée
          </Button>
        </>
      )}
      <Button variant="bordeaux" className="!px-2.5 !py-1 !text-xs" disabled={pending} onClick={() => run("cancel")}>
        Annuler
      </Button>
    </div>
  );
}
