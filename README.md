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

- **Vue.js 3** avec Composition API et TypeScript
- **Pinia** pour le state management
- **Dexie.js** pour le stockage IndexedDB
- **Chart.js** + vue-chartjs pour les graphiques
- **vite-plugin-pwa** pour la Progressive Web App
- **Vite** comme bundler

## Structure du projet

```
src/
├── assets/styles/          # CSS (variables, reset, utilitaires)
├── components/
│   ├── common/             # BaseButton, BaseInput, BaseCard, BaseSlider, BaseSelect
│   ├── layout/             # AppHeader, AppNavigation
│   ├── rack/               # RackForm, RackVisual, RackInfo
│   ├── consumption/        # ConsumptionForm, ConsumptionList
│   └── stats/              # ConsumptionChart, StatsTable
├── composables/            # useWeek, useExportImport
├── services/
│   ├── database/           # Configuration Dexie.js et repositories
│   └── calculations/       # Formules steres, semaines ISO, statistiques
├── stores/                 # Pinia stores (rackStore, consumptionStore)
├── types/                  # Types TypeScript
├── views/                  # Pages de l'application
└── router/                 # Configuration Vue Router
```

## Installation

```sh
yarn install
```

## Developpement

```sh
yarn dev
```

L'application sera disponible sur `http://localhost:5173`

## Build de production

```sh
yarn build
```

Les fichiers seront generes dans le dossier `dist/`

## Autres commandes

```sh
# Verification des types TypeScript
yarn type-check

# Linter (oxlint + eslint)
yarn lint

# Tests unitaires
yarn test:unit

# Formatage du code
yarn format
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
