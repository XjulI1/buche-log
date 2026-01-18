# Buche-Log API

API REST pour la synchronisation de l'application Buche-Log PWA avec une base de données MariaDB.

## Prérequis

- Node.js 20+
- MariaDB 11+
- Docker (optionnel)

## Configuration

Créer un fichier `.env` à la racine du projet sur la base du .env.example

## Installation de la base de données

Exécuter le script SQL sur votre instance MariaDB :

```bash
mysql -u root -p < migrations/001_initial_schema.sql
```

## Développement

```bash
npm install
npm run dev
```

## Production avec Docker

```bash
# Build
docker build -t buche-log-api .

# Run
docker run -p 3000:3000 --env-file .env buche-log-api
```

## Endpoints API

### Authentification

| Méthode | Endpoint             | Description                     |
| ------- | -------------------- | ------------------------------- |
| POST    | `/api/auth/register` | Créer un compte                 |
| POST    | `/api/auth/login`    | Se connecter                    |
| GET     | `/api/auth/me`       | Info utilisateur (auth requise) |

### Synchronisation

| Méthode | Endpoint           | Description                      |
| ------- | ------------------ | -------------------------------- |
| POST    | `/api/sync`        | Synchronisation bidirectionnelle |
| GET     | `/api/sync/status` | Statut de la sync                |

### Racks

| Méthode | Endpoint         | Description       |
| ------- | ---------------- | ----------------- |
| GET     | `/api/racks`     | Liste des racks   |
| GET     | `/api/racks/:id` | Détail d'un rack  |
| POST    | `/api/racks`     | Créer un rack     |
| PUT     | `/api/racks/:id` | Modifier un rack  |
| DELETE  | `/api/racks/:id` | Supprimer un rack |

### Consommations

| Méthode | Endpoint                | Description          |
| ------- | ----------------------- | -------------------- |
| GET     | `/api/consumptions`     | Liste des entrées    |
| GET     | `/api/consumptions/:id` | Détail d'une entrée  |
| POST    | `/api/consumptions`     | Créer une entrée     |
| PUT     | `/api/consumptions/:id` | Modifier une entrée  |
| DELETE  | `/api/consumptions/:id` | Supprimer une entrée |

### Health Check

```bash
curl http://localhost:3000/health
```

## Authentification

Toutes les routes (sauf `/api/auth/register`, `/api/auth/login` et `/health`) requièrent un token JWT :

```
Authorization: Bearer <token>
```

## Synchronisation

L'endpoint `/api/sync` gère la synchronisation bidirectionnelle :

- Envoie les modifications locales au serveur
- Reçoit les modifications du serveur depuis la dernière sync
- Résout les conflits avec la stratégie "le plus récent gagne"

### Requête

```json
{
  "lastSyncTimestamp": "2024-01-15T10:00:00.000Z",
  "racks": [
    {
      "data": { ... },
      "action": "create|update|delete",
      "localUpdatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "consumptions": [...]
}
```

### Réponse

```json
{
  "serverTimestamp": "2024-01-15T10:05:00.000Z",
  "racks": {
    "created": [...],
    "updated": [...],
    "deleted": ["id1", "id2"]
  },
  "consumptions": {
    "created": [...],
    "updated": [...],
    "deleted": ["id1", "id2"]
  },
  "conflicts": [...]
}
```
