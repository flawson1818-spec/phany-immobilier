"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Alert } from "./ui";

export function FavoriteButton({
  propertyId,
  initial,
  authenticated,
}: {
  propertyId: string;
  initial: boolean;
  authenticated: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <Button
      variant={fav ? "bordeaux" : "outline"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (!authenticated) {
            router.push(`/login?next=/properties/${propertyId}`);
            return;
          }
          const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId }),
          });
          if (res.ok) {
            const { favorited } = await res.json();
            setFav(favorited);
          }
        })
      }
    >
      {fav ? "♥ Dans mes favoris" : "♡ Ajouter aux favoris"}
    </Button>
  );
}

export function VisitRequestButton({
  propertyId,
  authenticated,
}: {
  propertyId: string;
  authenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preferredAt, setPreferredAt] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!authenticated) {
    return (
      <Button variant="gold" onClick={() => router.push(`/login?next=/properties/${propertyId}`)}>
        Demander une visite
      </Button>
    );
  }

  return (
    <div className="w-full">
      {!open ? (
        <Button variant="gold" onClick={() => setOpen(true)}>
          Demander une visite
        </Button>
      ) : (
        <form
          className="space-y-2 rounded-xl border border-navy-100 bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              setMsg(null);
              const res = await fetch("/api/visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  propertyId,
                  preferredAt: preferredAt || undefined,
                  note: note || undefined,
                }),
              });
              const json = await res.json();
              if (res.ok) {
                setMsg({ tone: "success", text: "Demande envoyée. PHANY vous recontacte." });
                setOpen(false);
                router.refresh();
              } else {
                setMsg({ tone: "error", text: json.error ?? "Erreur." });
              }
            });
          }}
        >
          <label className="block text-sm font-medium text-navy-800">Date souhaitée (optionnel)</label>
          <input
            type="datetime-local"
            value={preferredAt}
            onChange={(e) => setPreferredAt(e.target.value)}
            className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Message (optionnel)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-navy-100 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer la demande"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}
      {msg && (
        <div className="mt-2">
          <Alert tone={msg.tone}>{msg.text}</Alert>
        </div>
      )}
    </div>
  );
}
