# BeatDrop Project

Site perso de partage de productions pour beatmakers, inspiré d'Untitled — **sans limite de dossiers**.

- Crée autant de **dossiers et sous-dossiers** que tu veux, avec pochette et description
- Upload par glisser-déposer (MP3, WAV, AIFF, FLAC, M4A, OGG — 500 Mo max par fichier)
- Réordonne les sons par glisser-déposer, ajoute BPM et tonalité
- Chaque dossier a un **lien client** privé (non devinable, révocable)
- Lecteur avec forme d'onde, **lecture enchaînée automatique**, contrôles clavier et écran verrouillé
- Interrupteur **Téléchargement actif / inactif** par dossier, appliqué côté serveur (+ « Tout télécharger en .zip »)

## Stack

| Rôle | Service | Coût |
|---|---|---|
| Site + API | Next.js 15 sur **Vercel** | Gratuit (Hobby) |
| Base de données | **Supabase** (Postgres) | Gratuit (500 Mo — des dizaines de milliers de dossiers) |
| Fichiers audio | **Cloudflare R2** | 10 Go gratuits, **bande passante gratuite**, puis ~0,015 $/Go/mois |

Le nombre de dossiers n'est jamais limité : ce sont de simples lignes en base. Seul l'espace de stockage audio compte.

---

## Mise en ligne (≈ 15 min)

### 1. Supabase — base de données

1. Crée un compte et un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, colle le contenu de [`supabase/schema.sql`](supabase/schema.sql), clique **Run**.
3. **Project Settings → API** : note l'**URL** du projet et la clé **`service_role`** (secrète).

### 2. Cloudflare R2 — stockage audio

1. Sur [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → active R2 → **Create bucket** (ex. `beatdrop`). Laisse-le **privé**.
2. Note ton **Account ID** (affiché sur la page R2).
3. **R2 → Manage API tokens → Create API token** : permission *Object Read & Write*, limitée à ton bucket. Note l'**Access Key ID** et le **Secret Access Key**.
4. Dans ton bucket → **Settings → CORS policy**, colle (remplace l'URL par celle de ton site Vercel) :

```json
[
  {
    "AllowedOrigins": ["https://ton-site.vercel.app", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

> Sans cette règle CORS, l'upload depuis le navigateur et le « Tout télécharger (.zip) » échouent.

### 3. Vercel — hébergement

1. Sur [vercel.com](https://vercel.com) → **Add New → Project** → importe ce repo GitHub.
2. Dans **Environment Variables**, ajoute toutes les variables de [`.env.example`](.env.example) :

| Variable | Valeur |
|---|---|
| `ADMIN_PASSWORD` | Ton mot de passe admin (long !) |
| `SESSION_SECRET` | 32+ caractères aléatoires (`openssl rand -base64 48`) |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé `service_role` |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Infos R2 |

3. **Deploy**. Ensuite, mets à jour `AllowedOrigins` dans le CORS R2 avec l'URL finale (ou ton domaine perso).

### 4. Utilisation

- Va sur `https://ton-site/admin`, connecte-toi avec `ADMIN_PASSWORD`.
- Crée un dossier, glisse tes sons, active/désactive le téléchargement, clique **Copier le lien client** et envoie-le.
- **Nouveau lien** révoque l'ancien lien d'un dossier (utile si un lien a fuité).
- Partager un dossier donne aussi accès à ses sous-dossiers.

---

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseigne les valeurs
npm run dev                  # http://localhost:3000
```

```bash
npm test          # tests unitaires (Vitest)
npm run lint
npm run typecheck
npm run build
```

## Architecture

```
src/
  app/
    page.tsx                    accueil
    login/                      connexion admin
    admin/                      tableau de bord + édition d'un dossier (protégé par middleware)
    p/[slug]/                   page client (lien de partage)
    api/
      auth/                     login / logout (cookie JWT httpOnly)
      folders/                  CRUD dossiers, ordre des sons, régénération du lien
      uploads/                  URL signée pour upload direct navigateur → R2
      tracks/                   CRUD sons
      s/[slug]/tracks/[id]      lecture / téléchargement public (vérifie le droit de téléchargement)
  components/
    player/                     lecteur global persistant + forme d'onde
    admin/  share/              UI admin et client
  lib/
    access.ts                   règles pures (téléchargement, slugs, noms de fichiers…) + tests
    session.ts  auth.ts         session admin
    repo.ts  db.ts  r2.ts       accès Supabase et R2 (serveur uniquement)
supabase/schema.sql             schéma SQL
```

### Sécurité

- Le repo est public : **aucun secret dans le code**. Tout passe par les variables d'environnement.
- La base n'est accessible qu'au serveur (clé `service_role`) ; RLS est activé sans policy, donc les clés publiques n'ont accès à rien.
- Les fichiers R2 restent privés ; le site ne distribue que des URL signées de courte durée.
- Téléchargement désactivé ⇒ aucune URL de téléchargement n'est émise et la route renvoie 403.
- **Limite connue :** un son qu'on peut écouter peut toujours être enregistré par un client déterminé (comme sur Untitled). Le blocage empêche le téléchargement direct du fichier original.
