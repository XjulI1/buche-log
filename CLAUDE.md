# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server (http://localhost:5173)
yarn build        # Type-check + production build
yarn type-check   # TypeScript verification only
yarn lint         # Run oxlint then eslint with autofix
yarn test:unit    # Run tests with Vitest
yarn format       # Format code with Prettier
```

Run a single test file:
```bash
yarn test:unit src/services/calculations/stere.test.ts
```

## Architecture

Application Vue.js 3 de suivi de consommation de bois de chauffage (PWA).

### Data Flow

```
Views -> Stores (Pinia) -> Services/Database (Dexie/IndexedDB)
                       -> Services/Calculations
```

### Key Layers

- **types/** : TypeScript interfaces (`Rack`, `ConsumptionEntry`, `WeeklyStats`, `YearlyStats`)
- **services/database/** : Dexie.js configuration (`db.ts`) and repositories for CRUD operations
- **services/calculations/** : Business logic - stere conversion formulas, ISO week handling, statistics aggregation
- **stores/** : Pinia stores that orchestrate database access and expose reactive state
- **composables/** : Reusable logic (`useWeek`, `useExportImport`)
- **components/** : Organized by domain (`common/`, `rack/`, `consumption/`, `stats/`, `layout/`)
- **views/** : Route-level components

### Stere Calculation

Volume in steres depends on log size coefficient:
- 50cm logs: 0.80
- 33cm logs: 0.70
- 25cm logs: 0.60

Formula: `steres = volume_m3 / coefficient`

### Data Persistence

IndexedDB via Dexie.js. Two tables:
- `racks`: Wood rack configurations
- `consumptions`: Reload and level entries indexed by `[year+weekNumber]`

### PWA

Configured with vite-plugin-pwa. Service worker auto-updates. Icons are SVG in `public/`.
