"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Textarea, Alert } from "./ui";
import { PROPERTY_TYPE_LABELS, OPERATION_LABELS, LOME_DISTRICTS } from "@/lib/constants";

export type PropertyFormValues = {
  id?: string;
  title: string;
  type: string;
  operation: string;
  price: string;
  city: string;
  district: string;
  address: string;
  surface: string;
  bedrooms: string;
  bathrooms: string;
  furnished: boolean;
  features: string;
  description: string;
};

const EMPTY: PropertyFormValues = {
  title: "",
  type: "HOUSE",
  operation: "RENT",
  price: "",
  city: "Lomé",
  district: "",
  address: "",
  surface: "",
  bedrooms: "",
  bathrooms: "",
  furnished: false,
  features: "",
  description: "",
};

export function PropertyForm({ initial }: { initial?: Partial<PropertyFormValues> }) {
  const router = useRouter();
  const [values, setValues] = useState<PropertyFormValues>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const isEdit = Boolean(values.id);

  const set = <K extends keyof PropertyFormValues>(k: K, v: PropertyFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      setError(null);
      const payload = {
        title: values.title,
        type: values.type,
        operation: values.operation,
        price: Number(values.price),
        city: values.city,
        district: values.district,
        address: values.address || undefined,
        surface: values.surface ? Number(values.surface) : undefined,
        bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
        bathrooms: values.bathrooms ? Number(values.bathrooms) : undefined,
        furnished: values.furnished,
        features: values.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        description: values.description,
      };

      const res = await fetch(isEdit ? `/api/properties/${values.id}` : "/api/properties", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Enregistrement impossible");
        return;
      }
      router.push(`/owner/properties/${json.id}/edit`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-navy-100 bg-white p-5">
      {error && <Alert tone="error">{error}</Alert>}

      <div>
        <Label htmlFor="title">Titre de l&apos;annonce</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Villa 4 chambres avec jardin à Baguida"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="operation">Opération</Label>
          <Select id="operation" value={values.operation} onChange={(e) => set("operation", e.target.value)}>
            {Object.entries(OPERATION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Type de bien</Label>
          <Select id="type" value={values.type} onChange={(e) => set("type", e.target.value)}>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Prix (FCFA){values.operation === "RENT" ? " / mois" : ""}</Label>
          <Input
            id="price"
            type="number"
            min={1}
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="district">Quartier</Label>
          <Input
            id="district"
            list="districts"
            value={values.district}
            onChange={(e) => set("district", e.target.value)}
            required
          />
          <datalist id="districts">
            {LOME_DISTRICTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="address">Adresse / repère (optionnel)</Label>
          <Input id="address" value={values.address} onChange={(e) => set("address", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="bedrooms">Chambres</Label>
          <Input id="bedrooms" type="number" min={0} value={values.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bathrooms">Salles d&apos;eau</Label>
          <Input id="bathrooms" type="number" min={0} value={values.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="surface">Surface (m²)</Label>
          <Input id="surface" type="number" min={0} value={values.surface} onChange={(e) => set("surface", e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.furnished}
          onChange={(e) => set("furnished", e.target.checked)}
        />
        Bien meublé
      </label>

      <div>
        <Label htmlFor="features">Équipements (séparés par des virgules)</Label>
        <Input
          id="features"
          value={values.features}
          onChange={(e) => set("features", e.target.value)}
          placeholder="parking, forage, climatisation, groupe électrogène"
        />
      </div>

      <div>
        <Label htmlFor="description">Description détaillée</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          minLength={20}
          rows={6}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer et ajouter des photos"}
      </Button>
    </form>
  );
}
