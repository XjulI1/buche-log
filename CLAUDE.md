# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start Nuxt dev server (http://localhost:3000) - UI + API
pnpm build        # Production build (Nitro output in .output/)
pnpm preview      # Serve the built app + API
pnpm type-check   # TypeScript verification (nuxt typecheck)
pnpm lint         # Run ESLint
pnpm test         # Run tests once with Vitest (happy-dom)
pnpm test:watch   # Run Vitest in watch mode
pnpm db:generate  # Generate a Drizzle migration from schema changes
pnpm db:migrate   # Apply pending migrations to MariaDB
pnpm db:studio    # Open Drizzle Studio
```

Run a single test file:
```bash
pnpm test app/services/calculations/__tests__/stere.test.ts
```

## Architecture

Application Nuxt 4 unique (PWA + API) de suivi de consommation de bois de chauffage. Front-end et back-end vivent dans le meme projet : le front est servi par Nuxt, l'API est servie par Nitro (le moteur serveur de Nuxt) sous `/api/*`.

### Data Flow

```
UI (app/pages, app/components)
  -> Pinia stores (app/stores)
    -> Local: repositories Dexie (app/services/database)
    -> Remote (sync): apiClient -> /api/* -> Nitro handlers -> Drizzle -> MariaDB
```

### Key Layers

- **app/** : application Vue 3 (auto-importee par Nuxt)
  - `pages/` : routing fichier-base (index, releve, historique, stats, rack, settings)
  - `components/` : organises par domaine (common, layout, rack, reading, stats, sync)
  - `composables/` : useWeek, useExportImport, useBreakpoint (mobile / desktop >= 900px), useToast, usePushReminder
  - `stores/` : Pinia stores (rackStore, consumptionStore, syncStore) — auto-importes via `@pinia/nuxt`
  - `services/database/` : Dexie + repositories (stockage local IndexedDB)
  - `services/calculations/` : formules steres, semaines ISO, saisons de chauffe, statistiques et prevision
  - `services/sync/` : apiClient ($fetch sur `/api/*` relatif) + syncService (file d'attente offline)
  - `plugins/sync.client.ts` : initialise le syncStore au montage (client-only)
- **server/** : API Nitro
  - `api/` : handlers Nitro (un fichier par endpoint, conventions `[id].get.ts`, `[id].post.ts`, etc.)
  - `database/schema.ts` : source de verite Drizzle (users, racks, consumptions, sync_metadata)
  - `database/migrations/` : migrations generees par drizzle-kit
  - `utils/db.ts` : pool mysql2 + client Drizzle (singleton via `useDb()`)
  - `utils/auth.ts` : `requireAuth(event)` — verifie le JWT et attache `event.context.user`
  - `utils/mappers.ts` : conversion lignes DB -> objets API
  - `utils/sync.ts` : logique last-write-wins de la sync bidirectionnelle
- **shared/utils/** : code partage client/serveur (`isoWeek`, `legacyReadings` = conversion des anciennes saisies)
- **shared/types/** : types TypeScript partages client/serveur (`Rack`, `ConsumptionEntry`, `SyncRequest`, etc.). Importables via `#shared/types`.

### Releves de niveau

Une entree (`ConsumptionEntry`, table `consumptions`) est un **releve** : le niveau constate (`level`, 0-100).
Si un rechargement a eu lieu depuis le releve precedent, on stocke le niveau juste avant (`reloadFrom`)
et juste apres (`reloadTo`). La consommation d'un releve est deduite du releve precedent :
`(precedent - reloadFrom) + (reloadTo - level)`, ou `precedent - level` sans rechargement.

Les anciennes saisies (`type` + `percentage`, par delta) sont converties par `convertLegacyEntries` :
migration Dexie v4 cote client, plugin `server/plugins/migrate-readings.ts` cote serveur, import d'un export v1.

Les statistiques sont calculees par **saison de chauffe** (1er octobre -> 30 septembre, cf. `season.ts`).

### Stere Calculation

Volume in steres depends on log size coefficient:
- 50cm logs: 0.80
- 33cm logs: 0.70
- 25cm logs: 0.60

Formula: `steres = volume_m3 / coefficient`

### Persistence

- **Offline (PWA)** : IndexedDB via Dexie.js (`app/services/database/db.ts`). Tables : `racks`, `consumptions`, `syncQueue`, `syncConfig`.
- **Online (serveur)** : MariaDB via Drizzle + mysql2 (`server/database/schema.ts`). Tables : `users`, `racks`, `consumptions`, `sync_metadata`. Soft-deletes via `deleted_at`.

### Sync

Le `syncService` (singleton client) gere une file d'attente locale (`db.syncQueue`). Quand le client est en ligne et configure, il envoie un `POST /api/sync` avec les changements locaux + son `lastSyncTimestamp`, et recoit en retour les changements serveur depuis cette date. Strategie de resolution de conflits : last-write-wins sur `updated_at`. L'API est **same-origin** (Nuxt sert front et API), donc l'URL n'est pas configurable cote utilisateur.

### Auth

- bcryptjs (cost 10) pour les mots de passe
- JWT (365 jours) genere par `jsonwebtoken`, signe avec `runtimeConfig.jwtSecret`
- Token stocke cote client dans Dexie (`syncConfig`) et cote serveur dans `users.api_token`
- Middleware utilitaire `requireAuth(event)` a appeler en tete de chaque handler protege

### Runtime Config

Variables d'environnement consommees par Nuxt (`runtimeConfig` -> `useRuntimeConfig()`) :
- `NUXT_DB_HOST`, `NUXT_DB_PORT`, `NUXT_DB_NAME`, `NUXT_DB_USER`, `NUXT_DB_PASSWORD`
- `NUXT_JWT_SECRET`
- `NUXT_PUBLIC_VAPID_PUBLIC_KEY`, `NUXT_VAPID_PRIVATE_KEY`, `NUXT_VAPID_SUBJECT` (rappel Web Push, generer avec `pnpm vapid:generate`)

Voir `.env.example` pour le gabarit.

### Rappel hebdomadaire (Web Push)

Abonnements dans `push_subscriptions` (jour/heure/fuseau choisis par l'utilisateur). La tache Nitro
`reminders:weekly` (`server/tasks/`) tourne toutes les heures et notifie ceux qui n'ont pas de releve dans
la semaine ISO. Les push sont envoyes **sans contenu** (seul l'en-tete VAPID est signe, `server/utils/webPush.ts`) ;
le texte est fixe dans `public/push-sw.js`, charge par le service worker via `workbox.importScripts`.

### Migrations SQL

Les fichiers de `server/database/migrations/` sont ecrits a la main et appliques dans l'ordre
(`0000_baseline.sql`, `0001_readings.sql`, `0002_push_subscriptions.sql`).

### PWA

Configuree via `@vite-pwa/nuxt` dans `nuxt.config.ts`. Service worker auto-updates. Les requetes `/api/*` sont exclues du cache SW (`navigateFallbackDenylist`). Icones SVG/PNG dans `public/`.

### Important

- `ssr: false` dans `nuxt.config.ts` : l'application tourne en SPA (PWA), car Dexie/IndexedDB est navigateur-only.
- Le plugin `sync.client.ts` est suffixe `.client` pour ne s'executer que cote client.
- Aliases : `~/` pointe sur `app/`, `#shared/` pointe sur `shared/`.
