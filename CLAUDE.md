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
    -> apiClient (app/services/api) -> /api/* -> Nitro handlers -> Drizzle -> MariaDB
```

### Key Layers

- **app/** : application Vue 3 (auto-importee par Nuxt)
  - `pages/` : routing fichier-base (index, login, releve, historique, stats, rack, settings)
  - `components/` : organises par domaine (account, common, layout, rack, reading, stats)
  - `composables/` : useWeek, useExportImport, useBreakpoint (mobile / desktop >= 900px), useToast, usePushReminder, useOnlineStatus
  - `stores/` : Pinia stores (authStore, rackStore, consumptionStore) — auto-importes via `@pinia/nuxt`
  - `services/calculations/` : formules steres, semaines ISO, saisons de chauffe, statistiques et prevision
  - `services/api/` : apiClient (`fetch` sur `/api/*` relatif, token Bearer, deserialisation des dates, `NetworkError` / `ApiError`)
  - `middleware/auth.global.ts` : redirige vers `/login` sans session
  - `plugins/auth.client.ts` : restaure la session et deconnecte sur un 401 (client-only)
- **server/** : API Nitro
  - `api/` : handlers Nitro (un fichier par endpoint, conventions `[id].get.ts`, `[id].post.ts`, etc.)
  - `database/schema.ts` : source de verite Drizzle (users, racks, consumptions, push_subscriptions)
  - `database/migrations/` : migrations SQL ecrites a la main
  - `utils/db.ts` : pool mysql2 + client Drizzle (singleton via `useDb()`)
  - `utils/auth.ts` : `requireAuth(event)` — verifie le JWT et attache `event.context.user`
  - `utils/inputs.ts` : validation des body (`parseRackInput` recalcule les volumes, `parseReadingInput`)
  - `utils/importData.ts` : preparation d'un import (ids regeneres, conversion v1)
  - `utils/userData.ts` : soft delete de toutes les donnees d'un utilisateur
  - `utils/mappers.ts` : conversion lignes DB -> objets API
- **shared/utils/** : code partage client/serveur (`isoWeek`, `stere`, `legacyReadings` = conversion des anciennes saisies)
- **shared/types/** : types TypeScript partages client/serveur (`Rack`, `ConsumptionEntry`, `ExportData`, `AuthResponse`, etc.). Importables via `#shared/types`.

### Releves de niveau

Une entree (`ConsumptionEntry`, table `consumptions`) est un **releve** : le niveau constate (`level`, 0-100).
Si un rechargement a eu lieu depuis le releve precedent, on stocke le niveau juste avant (`reloadFrom`)
et juste apres (`reloadTo`). La consommation d'un releve est deduite du releve precedent :
`(precedent - reloadFrom) + (reloadTo - level)`, ou `precedent - level` sans rechargement.

Les anciennes saisies (`type` + `percentage`, par delta) sont converties par `convertLegacyEntries` :
plugin `server/plugins/migrate-readings.ts` au demarrage du serveur, et import d'un export v1 (`server/utils/importData.ts`).

Les statistiques sont calculees par **saison de chauffe** (1er octobre -> 30 septembre, cf. `season.ts`).

### Stere Calculation

Volume in steres depends on log size coefficient:
- 50cm logs: 0.80
- 33cm logs: 0.70
- 25cm logs: 0.60

Formula: `steres = volume_m3 / coefficient`

### Persistence

Donnees uniquement cote serveur : MariaDB via Drizzle + mysql2 (`server/database/schema.ts`). Pas de stockage
local des donnees (le mode offline et la synchronisation ont ete supprimes). Soft-deletes via `deleted_at`.

API REST same-origin (Nuxt sert front et API) :
- `racks/*`, `consumptions/*` (`GET /api/consumptions?rackId=`) : CRUD. Les ids sont generes par le serveur,
  les volumes des porte-buches sont recalcules par le serveur, la semaine ISO d'un releve est fournie par le client
  (fuseau horaire de l'utilisateur).
- `data` : `GET` export JSON v2, `PUT` import (remplace toutes les donnees, transaction), `DELETE` reinitialisation.

### Auth

- bcryptjs (cost 10) pour les mots de passe
- JWT (365 jours) genere par `jsonwebtoken`, signe avec `runtimeConfig.jwtSecret`
- Connexion obligatoire. Token stocke cote client dans `localStorage` (`buche-log:token`) et cote serveur dans `users.api_token`
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
(`0000_baseline.sql`, `0001_readings.sql`, `0002_push_subscriptions.sql`, `0003_drop_sync_metadata.sql`).

### PWA

Configuree via `@vite-pwa/nuxt` dans `nuxt.config.ts`. Service worker auto-updates. Seul le shell de l'app est mis en cache : les requetes `/api/*` en sont exclues (`navigateFallbackDenylist`), et un bandeau previent quand le reseau manque. Icones SVG/PNG dans `public/`.

### Important

- `ssr: false` dans `nuxt.config.ts` : l'application tourne en SPA (PWA).
- Le plugin `auth.client.ts` est suffixe `.client` pour ne s'executer que cote client.
- Aliases : `~/` pointe sur `app/`, `#shared/` pointe sur `shared/`.
