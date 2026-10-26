# Buche-Log

Application de suivi de consommation de bois de chauffage, semaine par semaine.

## Fonctionnalites

- **Configuration du porte-buches** : dimensions (hauteur, largeur, profondeur) et taille des buches (25, 33 ou 50 cm)
- **Calcul automatique du volume en steres** selon les coefficients de conversion
- **Enregistrement des consommations** : saisir le pourcentage consomme avec conversion instantanee en steres
- **Enregistrement des rechargements** : a 100% ou pourcentage personnalise
- **Suivi du niveau restant** : calcule automatiquement a partir des rechargements et consommations
- **Statistiques annuelles** : graphique de consommation + tableau recapitulatif par semaine
- **Export/Import des donnees** : sauvegarde JSON pour ne rien perdre
- **PWA installable** : fonctionne hors-ligne sur mobile et desktop

## Calcul des steres

Le **stere** est l'unite de mesure du bois de chauffage. 1 stere = 1 m³ de bois empile avec des buches de 1m.

Les buches plus courtes se tassent mieux, donc le coefficient de conversion varie :

| Taille des buches | Coefficient |
|-------------------|-------------|
| 50 cm             | 0.80        |
| 33 cm             | 0.70        |
| 25 cm             | 0.60        |

**Formule** : `Steres = Volume (m³) / Coefficient`

## Stack technique

- **Nuxt 4** (Vue 3 + Nitro) — front et API regroupes dans un meme projet
- **Pinia** pour le state management (auto-importe via `@pinia/nuxt`)
- **Dexie.js** pour le stockage offline (IndexedDB)
- **Drizzle ORM** + **mysql2** pour la persistance serveur (MariaDB)
- **bcryptjs** + **jsonwebtoken** pour l'authentification
- **Chart.js** + vue-chartjs pour les graphiques
- **@vite-pwa/nuxt** pour la Progressive Web App

## Structure du projet

```
app/                          # Application Vue (UI)
├── app.vue                   # Layout racine (NuxtPage)
├── assets/styles/            # CSS (variables, reset, utilitaires)
├── components/
│   ├── common/               # BaseButton, BaseInput, BaseCard, BaseSlider, BaseSelect
│   ├── layout/               # AppHeader, AppNavigation
│   ├── rack/                 # RackForm, RackVisual, RackInfo
│   ├── consumption/          # ConsumptionForm, ConsumptionList
│   ├── stats/                # ConsumptionChart, StatsTable
│   └── sync/                 # SyncSettings, SyncStatus
├── composables/              # useWeek, useExportImport
├── pages/                    # index, rack, consumption, stats, settings
├── plugins/                  # sync.client.ts (init du syncStore)
├── services/
│   ├── database/             # Dexie + repositories
│   ├── calculations/         # Formules steres, semaines ISO, statistiques
│   └── sync/                 # apiClient, syncService
└── stores/                   # Pinia stores (rackStore, consumptionStore, syncStore)

server/                       # API (Nitro)
├── api/
│   ├── health.get.ts
│   ├── auth/{register,login}.post.ts + me.get.ts
│   ├── racks/{index,[id]}.{get,post,put,delete}.ts
│   ├── consumptions/{index,[id]}.{get,post,put,delete}.ts
│   └── sync/{index.post,status.get}.ts
├── database/
│   ├── schema.ts             # Source de verite Drizzle
│   └── migrations/           # Migrations SQL (drizzle-kit)
└── utils/
    ├── db.ts                 # Pool mysql2 + client Drizzle
    ├── auth.ts               # requireAuth(event) — verification JWT
    ├── mappers.ts            # row -> API
    └── sync.ts               # logique de synchronisation bidirectionnelle

shared/types/                 # Types partages client/serveur
public/                       # Icones PWA + favicon
nuxt.config.ts
drizzle.config.ts
Dockerfile
```

## Installation

```sh
pnpm install
cp .env.example .env          # ajuster les valeurs DB et JWT
pnpm db:migrate               # applique le schema MariaDB
```

## Developpement

```sh
pnpm dev
```

L'application est disponible sur `http://localhost:3000` (UI et `/api/*` sur la meme origine).

## Build de production

```sh
pnpm build
pnpm preview
```

Le build genere `.output/` (sortie Nitro).

## Autres commandes

```sh
pnpm typecheck              # Verification des types TypeScript
pnpm lint                   # oxlint + eslint
pnpm test:unit              # Tests unitaires (Vitest)
pnpm format                 # Prettier sur app/ server/ shared/
pnpm db:generate            # Generer une migration depuis le schema Drizzle
pnpm db:migrate             # Appliquer les migrations
pnpm db:studio              # Interface Drizzle Studio
```

## Docker

```sh
docker build -t buche-log .
docker run -p 3000:3000 --env-file .env buche-log
```

## Utilisation

1. **Configurer le porte-buches** : entrer les dimensions et la taille des buches
2. **Enregistrer un rechargement** : quand vous remplissez le porte-buches (100% par defaut)
3. **Enregistrer les consommations** : saisir le pourcentage consomme (ex: 10% = X steres)
4. **Consulter les statistiques** : voir la consommation par semaine et sur l'annee

### Methode de calcul

Le niveau du porte-buches est calcule automatiquement :
- Un **rechargement** remet le niveau au pourcentage indique (generalement 100%)
- Une **consommation** diminue le niveau du pourcentage saisi

Exemple :
1. Rechargement a 100% → niveau = 100%
2. Consommation de 20% → niveau = 80%
3. Consommation de 15% → niveau = 65%
4. Rechargement a 100% → niveau = 100%

## PWA

L'application peut etre installee sur votre appareil :
- Sur mobile : utiliser "Ajouter a l'ecran d'accueil"
- Sur desktop : cliquer sur l'icone d'installation dans la barre d'adresse

Une fois installee, elle fonctionne hors-ligne grace au Service Worker.

## Licence

MIT
