"use client";

import { useState } from "react";
import { PropertyCard, type PropertyCardData } from "./PropertyCard";
import { Button, Alert } from "./ui";

type ResultRow = PropertyCardData & { compatibility: number; matched: string[] };

const EXAMPLES = [
  "Maison 3 chambres à Agoè, avec parking, max 250 000 FCFA par mois",
  "Villa meublée à louer à Baguida avec piscine",
  "Terrain à vendre à Adétikopé, budget 5 millions",
  "Studio pas cher à Tokoin, moins de 40 000 FCFA",
];

export function AiSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    results: ResultRow[];
    note: string;
    criteria: Record<string, unknown>;
    provider: string;
  } | null>(null);

  async function search(q: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors de la recherche.");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Impossible de contacter PHANY AI. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const criteriaChips = data
    ? Object.entries(data.criteria).filter(
        ([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0),
      )
    : [];

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length >= 3) search(query.trim());
        }}
        className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-lg sm:flex-row"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Décrivez le bien que vous cherchez…"
          className="flex-1 rounded-lg px-3 py-3 text-sm outline-none"
        />
        <Button type="submit" variant="gold" disabled={loading}>
          {loading ? "Recherche…" : "Rechercher avec PHANY AI"}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQuery(ex);
              search(ex);
            }}
            className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
          >
            {ex}
          </button>
        ))}
      </div>

      {(error || data) && (
        <div className="mt-6 rounded-2xl bg-white p-5 text-left">
          {error && <Alert tone="error">{error}</Alert>}
          {data && (
            <>
              <p className="text-sm text-muted">
                {data.note}{" "}
                <span className="text-xs">
                  (moteur : {data.provider === "heuristic" ? "heuristique PHANY" : data.provider})
                </span>
              </p>
              {criteriaChips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {criteriaChips.map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700"
                    >
                      {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.results.map((p) => (
                  <PropertyCard key={p.id} property={p} compatibility={p.compatibility} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
