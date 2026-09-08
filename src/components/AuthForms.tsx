"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Select, Alert } from "./ui";

function useRedirectTarget() {
  const sp = useSearchParams();
  return sp.get("next") || null;
}

export function LoginForm() {
  const router = useRouter();
  const next = useRedirectTarget();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setError(null);
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(fd)),
          });
          const json = await res.json();
          if (!res.ok) return setError(json.error ?? "Connexion impossible");
          router.push(next ?? json.redirect ?? "/");
          router.refresh();
        });
      }}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
      <div className="flex justify-between text-sm text-muted">
        <Link href="/forgot-password">Mot de passe oublié ?</Link>
        <Link href="/register" className="font-medium text-bordeaux-600">
          Créer un compte
        </Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setError(null);
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(fd)),
          });
          const json = await res.json();
          if (!res.ok) return setError(json.error ?? "Inscription impossible");
          router.push(json.redirect ?? "/");
          router.refresh();
        });
      }}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="name">Nom complet</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="phone">Téléphone (optionnel)</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+228 ..." />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe (8 caractères min.)</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div>
        <Label htmlFor="role">Je suis…</Label>
        <Select id="role" name="role" defaultValue="CLIENT">
          <option value="CLIENT">Un client (je cherche un bien)</option>
          <option value="OWNER">Un propriétaire (je propose un bien)</option>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
      <p className="text-center text-sm text-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-bordeaux-600">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <Alert tone="success">
        Si un compte existe pour cet email, un lien de réinitialisation vient d&apos;être envoyé
        (valable 1 heure).
      </Alert>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(fd)),
          });
          setDone(true);
        });
      }}
    >
      <div>
        <Label htmlFor="email">Votre email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setError(null);
          const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password: fd.get("password") }),
          });
          const json = await res.json();
          if (!res.ok) return setError(json.error ?? "Lien invalide ou expiré");
          router.push("/login");
        });
      }}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "…" : "Réinitialiser"}
      </Button>
    </form>
  );
}
