"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cx } from "./ui";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      className={cx("text-sm font-medium text-navy-700 hover:text-bordeaux-600", className)}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        })
      }
    >
      {pending ? "…" : "Déconnexion"}
    </button>
  );
}
