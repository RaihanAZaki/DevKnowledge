# DevKnowledge

A production-oriented developer knowledge workspace built with **Next.js 16**, **Tailwind CSS 4**, **Prisma 7**, **Neon PostgreSQL**, **JWT authentication**, and **Gemini cloud AI**.

The interface follows a calm SaaS visual system: off-white surfaces, muted gray borders, soft indigo accents, generous whitespace, and a low-contrast dark mode.

## Included modules

- **Authentication & roles** — register, login, logout, JWT session in an HttpOnly cookie, `ADMIN`, `MODERATOR`, and `MEMBER` roles.
- **Code Snippets** — ticket number, title, language/framework, category, before/after code, reason, impact, search/filter, edit and delete.
- **Documentation** — Markdown content, category/language filtering, tags, draft/published state, edit and delete.
- **Forum** — discussions, replies, tags, accepted solution, role/owner based management.
- **AI Chat** — Gemini API through a server-only route, recent conversation context, persistent chat history.
- **Dashboard** — live counts and recent knowledge from the database.
- **Settings** — profile update and role display.
- **Deployment** — Prisma migrations and Vercel + Neon ready configuration.

## Requirements

- Node.js **22.x** recommended for this project.
- npm 10+
- A Neon PostgreSQL database.
- A Gemini API key from Google AI Studio / Gemini API.

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy the example file:

```bash
cp .env.example .env
```

Fill in at least:

```env
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
JWT_SECRET="a-random-secret-with-at-least-32-characters"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.8-flash"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For Neon, use the **pooled PostgreSQL connection string** for the app. Prisma uses the PostgreSQL driver adapter included in this project.

## 3. Generate Prisma Client

```bash
npm run db:generate
```

## 4. Create database tables

For a clean database, apply the included migration:

```bash
npm run db:deploy
```

During active development, you can create later migrations with:

```bash
npm run db:migrate
```

## 5. Seed initial data

Optional admin credentials can be configured in `.env`:

```env
SEED_ADMIN_EMAIL="admin@devknowledge.local"
SEED_ADMIN_PASSWORD=""
```

Then seed:

```bash
npm run db:seed
```

Change the seed password before using this outside local development.

## 6. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main routes

| Page | Route |
| --- | --- |
| Login | `/login` |
| Dashboard | `/dashboard` |
| Code Snippets | `/snippets` |
| Documentation | `/documentation` |
| AI Chat | `/ai` |
| Forum | `/forum` |
| Settings | `/settings` |

## API routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register member + create JWT session |
| POST | `/api/auth/login` | Login + create JWT session |
| POST | `/api/auth/logout` | Clear JWT cookie |
| GET | `/api/auth/me` | Current authenticated user |
| PUT | `/api/users/me` | Update profile |
| GET/POST | `/api/snippets` | List/create snippets |
| GET/PUT/DELETE | `/api/snippets/:id` | Snippet detail/manage |
| GET/POST | `/api/documentation` | List/create docs |
| GET/PUT/DELETE | `/api/documentation/:id` | Document detail/manage |
| GET/POST | `/api/forum` | List/create discussions |
| GET/DELETE | `/api/forum/:id` | Discussion detail/manage |
| POST | `/api/forum/:id/comments` | Add reply |
| PUT | `/api/forum/:id/comments/:commentId/accept` | Mark accepted solution |
| GET/POST | `/api/ai/chat` | Load/send AI chat |
| GET | `/api/dashboard` | Dashboard metrics and recent content |

## Authentication model

1. Credentials are validated on the server.
2. Passwords are hashed using bcrypt.
3. The server signs a 7-day HS256 JWT.
4. The JWT is stored in an **HttpOnly**, `SameSite=Lax` cookie.
5. Every protected API verifies the token and reloads the user from PostgreSQL.
6. Mutation routes verify ownership or `ADMIN` / `MODERATOR` privileges.

`src/proxy.ts` performs an early page redirect when a session cookie is absent. API authorization remains the security boundary and cryptographically verifies the JWT.

## Gemini cloud AI

The browser calls only:

```text
POST /api/ai/chat
```

The Next.js backend then calls the Gemini API using `GEMINI_API_KEY`. The key is never included in client JavaScript.

The default model is configurable through `GEMINI_MODEL`; the included example uses `gemini-3.8-flash`. Cloud API availability, free quota, and billing limits are controlled by the provider, so check your Google AI project quota before production use.

## Deploy to Vercel + Neon

### Neon

1. Create a Neon project/database.
2. Copy its pooled PostgreSQL connection string.
3. Put it in local `.env` as `DATABASE_URL`.
4. Run `npm run db:deploy`.
5. Run `npm run db:seed` if you want the starter admin/content.

### Vercel

1. Push this folder to GitHub/GitLab/Bitbucket.
2. Import the repository into Vercel.
3. Add these environment variables in the Vercel project:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `NEXT_PUBLIC_APP_URL` (your production URL)
4. Deploy.

The build command in `package.json` is:

```bash
prisma generate && next build
```

Migrations are intentionally **not** run inside every Vercel build. Apply production migrations explicitly with `npm run db:deploy` against the production Neon database before/alongside a release.

## Project structure

```text
src/
├── app/
│   ├── (auth)/
│   ├── (app)/
│   └── api/
├── components/
├── generated/prisma/     # generated locally; gitignored
├── lib/
└── proxy.ts
prisma/
├── migrations/
├── schema.prisma
└── seed.ts
```

## Design system

Core colors are defined as CSS variables in `src/app/globals.css` and are shared by light/dark themes. The UI intentionally avoids heavy gradients, oversized shadows, and dense admin-dashboard styling.

## Production notes

Before using this in a larger organization, consider adding rate limiting for login and AI endpoints, email verification/password recovery, CSRF hardening for sensitive cross-site scenarios, audit logs, SSO/OIDC, object storage for attachments, full-text/semantic search, and pagination for high-volume datasets.
