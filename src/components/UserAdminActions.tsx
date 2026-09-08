"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["CLIENT", "OWNER", "AGENT", "ADMIN", "SUPER_ADMIN"];

export function UserAdminActions({
  id,
  role,
  isActive,
  canManageAdmins,
}: {
  id: string;
  role: Role;
  isActive: boolean;
  canManageAdmins: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function patch(body: Record<string, unknown>) {
    start(async () => {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={pending || (role === "SUPER_ADMIN" && !canManageAdmins)}
        value={role}
        onChange={(e) => patch({ role: e.target.value })}
        className="rounded border border-navy-100 px-2 py-1 text-xs"
      >
        {ROLES.map((r) => (
          <option key={r} value={r} disabled={r === "SUPER_ADMIN" && !canManageAdmins}>
            {r}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        onClick={() => patch({ isActive: !isActive })}
        className={`rounded px-2 py-1 text-xs font-semibold ${
          isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {isActive ? "Actif" : "Désactivé"}
      </button>
    </div>
  );
}
