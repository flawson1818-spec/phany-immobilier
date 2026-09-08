# PHANY IMMOBILIER

Plateforme immobilière intelligente pour Lomé / Togo : recherche en langage naturel
(**PHANY AI**), annonces vérifiées, workflow de publication, visites organisées.

Stack : **Next.js 15 (App Router)** · **TypeScript** · **Prisma + PostgreSQL** ·
**Tailwind CSS v4** · **Supabase Storage** · auth maison (session JWT HTTP-only).

---

## 1. Démarrage local

```bash
cp .env.example .env          # renseigner DATABASE_URL, DIRECT_URL, SESSION_SECRET
npm install                   # exécute aussi `prisma generate`
npx prisma migrate deploy     # applique la migration initiale
npm run db:seed               # comptes + biens de démo (optionnel)
npm run dev                   # http://localhost:3000
```

### Comptes de démonstration (`npm run db:seed`)

| Email | Rôle | Mot de passe |
| --- | --- | --- |
| `admin@phany.tg` (ou `SEED_ADMIN_EMAIL`) | SUPER_ADMIN | `SEED_ADMIN_PASSWORD` (`ChangeMoi2026!` par défaut) |
| `agent@phany.tg` | AGENT | `phany2026` |
| `proprio1@phany.tg`, `proprio2@phany.tg` | OWNER | `phany2026` |
| `client@phany.tg` | CLIENT | `phany2026` |

> Changez ces mots de passe avant toute mise en production réelle.

---

## 2. Variables d'environnement

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Connexion PostgreSQL de l'app (pooler Supabase, port 6543) |
| `DIRECT_URL` | ✅ | Connexion directe pour les migrations Prisma (port 5432) |
| `SESSION_SECRET` | ✅ | Signature des sessions JWT (≥ 32 caractères aléatoires) |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL publique (liens email de reset) |
| `NEXT_PUBLIC_SUPABASE_URL` | ⭐ | Projet Supabase (upload photos) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⭐ | Clé service pour l'upload serveur |
| `SUPABASE_STORAGE_BUCKET` | ⭐ | Nom du bucket (`properties`) |
| `AI_PROVIDER` | – | `heuristic` (défaut) · `anthropic` · `openai` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | – | si `AI_PROVIDER=anthropic` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | – | si `AI_PROVIDER=openai` |
| `RESEND_API_KEY` / `EMAIL_FROM` | – | envoi réel des emails ; sinon le lien de reset est loggé en console |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | – | premier compte admin créé par le seed |

⭐ Sans Supabase, l'upload retombe sur un stockage disque local (`public/uploads`) —
utile en dev, **à ne pas utiliser en production** (Vercel a un système de fichiers éphémère).

---

## 3. Déploiement (Vercel + Supabase)

1. **Supabase** → créer un projet → *Project Settings › Database* : copier les deux
   chaînes de connexion (`DATABASE_URL` = pooler `6543?pgbouncer=true`, `DIRECT_URL` = `5432`).
2. **Supabase Storage** → créer un bucket **public** nommé `properties`.
   Récupérer `Project URL` et la clé `service_role` (*Settings › API*).
3. **Vercel** → *New Project* → importer le repo GitHub.
4. Vercel › *Settings › Environment Variables* : renseigner toutes les variables ✅ + ⭐.
5. Le build lance automatiquement `prisma generate && prisma migrate deploy && next build`
   (script `vercel-build`). La base est migrée à chaque déploiement.
6. Après le premier déploiement, lancer le seed une fois :
   `npx dotenv -e .env.production -- npm run db:seed` en local avec les valeurs de prod,
   **ou** créer le compte admin manuellement.

---

## 4. Architecture

```
src/
  middleware.ts            RBAC edge : /admin, /owner, /client
  lib/
    jwt.ts                 sign/verify JWT (Edge-safe)
    session.ts             cookie de session HTTP-only
    auth.ts                getCurrentUser / requireRole / hash bcrypt
    api.ts                 helpers routes (route(), ok/fail, requireApiRole)
    validation.ts          schémas Zod (toutes les entrées)
    rate-limit.ts          limiteur mémoire (auth, AI, visites)
    audit.ts               AuditLog
    notifications.ts       Notification
    storage.ts             Supabase Storage + fallback local
    email.ts               Resend + fallback console
    property.ts            référence, statuts éditables
    ai/
      criteria.ts          schéma des critères extraits
      heuristic.ts         parseur langage naturel hors-ligne
      provider.ts          Anthropic / OpenAI + fusion heuristique
      search.ts            critères -> requête PUBLISHED -> scoring
  app/
    page.tsx               accueil + PHANY AI
    properties/            liste + détail public
    login|register|forgot-password|reset-password
    owner/                 mes biens, création, édition + photos, visites
    client/                espace, favoris, visites
    admin/                 dashboard, modération annonces, visites, utilisateurs
    api/
      auth/*               register, login, logout, me, forgot/reset password
      properties/*         CRUD + submit + images (upload/reorder/primary)
      admin/properties/*   liste + action (verify/publish/reject/needs_fix/archive)
      admin/users/*        liste + rôle/activation
      admin/stats          KPIs
      visits/*             demande + confirm/assign/complete/cancel
      favorites            toggle
      ai/search            PHANY AI
      health               diagnostic (db, storage, provider)
prisma/
  schema.prisma            User, PasswordResetToken, Property, PropertyImage,
                           Visit, Favorite, Notification, AuditLog
  migrations/              migration initiale
  seed.ts                  comptes + biens de démo
```

### Workflow d'une annonce

```
OWNER crée (DRAFT) → ajoute photos → soumet
        → PENDING → [ADMIN] verify → VERIFIED → publish → PUBLISHED
                         │ needs_fix → NEEDS_FIX (retour OWNER)
                         │ reject    → REJECTED
        PUBLISHED → unpublish / archive
```

Un bien **non PUBLISHED n'apparaît jamais** dans la recherche publique ni dans PHANY AI
(filtre `status: "PUBLISHED"` forcé côté serveur).

### PHANY AI — garanties

- N'interroge que la base PostgreSQL, uniquement les biens `PUBLISHED`.
- N'invente jamais de bien ni de disponibilité.
- Fonctionne sans clé API (parseur heuristique). Une clé Anthropic/OpenAI améliore
  l'extraction ; en cas d'échec LLM, repli automatique sur l'heuristique.
- Architecture prête pour brancher des sources externes autorisées (table à ajouter,
  même pipeline de scoring).

---

## 5. Sécurité

- Sessions JWT signées HS256, cookie `httpOnly` + `secure` en prod + `sameSite=lax`.
- Mots de passe bcrypt (coût 12). Anti-énumération sur login et forgot-password.
- Tokens de reset : hash SHA-256 en base, usage unique, expiration 1 h.
- **RBAC** double : middleware sur les préfixes + `requireApiRole` sur chaque route.
- **Anti-IDOR** : chaque accès à un bien / une visite vérifie la propriété.
- **Zod** sur toutes les entrées API.
- **Rate limiting** mémoire sur login, register, forgot-password, AI, visites
  (⚠️ mono-instance — passer à Upstash Redis pour du multi-instance).
- **Audit log** sur les actions sensibles (modération, rôles, reset).
- Aucun secret dans Git (`.env` ignoré, seul `.env.example` est versionné).

---

## 6. Reste à brancher avant production

- Stockage photos : **créer le bucket Supabase** (sinon fallback local non persistant).
- Email : renseigner `RESEND_API_KEY` (sinon les liens de reset ne partent pas).
- Rate limiting distribué (Upstash Redis) si déploiement multi-région.
- Paiement des visites : le modèle `Visit` porte déjà `feeAmount` / `feePaid` —
  brancher Mobile Money (Flooz / T-Money) sur la transition `CONFIRMED → ASSIGNED`.
- Notifications : les entrées `Notification` sont créées ; ajouter l'affichage (cloche)
  et un canal WhatsApp/SMS.
- Vérification d'identité des propriétaires (pièce + justificatif de propriété).
- Tests E2E (Playwright) sur les parcours auth / soumission / modération.
- `next/image` : ajouter le domaine réel du bucket si custom.

---

## 7. Commandes utiles

```bash
npm run dev            # développement
npm run build          # build production (next build)
npm run db:migrate     # créer une migration (dev)
npm run db:deploy      # appliquer les migrations (prod)
npm run db:seed        # (re)charger les données de démo
npm run db:studio      # explorer la base
npm run lint           # ESLint
```
