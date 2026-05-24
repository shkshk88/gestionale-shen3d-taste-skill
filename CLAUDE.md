# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Dental Lab CRM for a small lab in Israel (~3 internal users, ~10 dentist studios). Two surfaces:
- **Admin / operator app** (`/admin/*`) — cases, clients, calendar, 3D viewer, price lists, Vision Import, WhatsApp Agent
- **Client portal** (`/portal/*`) — dentists send and track cases, chat, 3D viewer

Currency is **ILS (₪)**, never EUR. Localization is IT / EN / FR / HE (HE is RTL).

The code lives under [`dental-lab-crm/`](dental-lab-crm/) (a subdirectory of the repo root). All commands below assume you `cd` into either `dental-lab-crm/backend` or `dental-lab-crm/frontend` first.

## Common commands

### Frontend ([`dental-lab-crm/frontend`](dental-lab-crm/frontend))
```bash
npm run dev               # Vite dev server (default :5173)
npm run build             # tsc -b && vite build  — Vercel runs this
npm run lint              # eslint, --max-warnings 0
npm run i18n:check        # diff missing keys across it/en/fr/he
```

### Backend ([`dental-lab-crm/backend`](dental-lab-crm/backend))
```bash
npm run start:dev         # Nest watch mode
npm run build             # nest build
npm run lint              # eslint --fix
npm test                  # jest
npm test -- path/to.spec  # single test file
npm run prisma:generate   # regenerate @prisma/client (run after schema change)
npm run prisma:studio     # GUI on the DB
npm run prisma:seed       # ts-node prisma/seed.ts
```

### Local stack (Docker)
```bash
docker compose up -d postgres redis minio      # infra only
docker compose up -d                           # full stack incl. backend
docker compose exec backend npx prisma db push # apply schema after pull
```

## Architecture

### Backend — NestJS + Prisma + Postgres
Modules under [`backend/src/modules/`](dental-lab-crm/backend/src/modules/) follow the standard Nest layout (`*.module.ts` / `*.controller.ts` / `*.service.ts`). Cross-cutting:
- `PrismaService` is provided by `prisma/prisma.module.ts` and imported wherever DB access is needed.
- Modules of note: `auth`, `users`, `clients`, `dentists`, `cases`, `files`, `chat`, `price-lists`, `notifications`, plus the **Agent Pack**:
  - `vision-import` — `POST /api/cases/import-from-vision` (multipart) → Gemini 2.5 Flash extracts data from prescription photos. Uses a `VisionProvider` interface so it can be swapped to Anthropic Claude. Audit row written to `llm_audit_log`.
  - `whatsapp` — verifier + sender + orchestrator + Meta webhook. Runs in **shadow mode by default**: when `WHATSAPP_AUTO_SEND` is false (env) OR template `metaStatus !== 'approved'`, messages are persisted in `whatsapp_messages` with `shadowOnly=true` and **not sent to Meta**. The flag can also be flipped from the DB via `POST /api/whatsapp/settings/auto-send` (table `system_settings`, key `whatsapp_auto_send`).
- WebSocket gateway for chat + notifications under `chat`/`notifications`; clients connect to the same origin as REST.
- Realtime is single-tenant — no multi-org logic anywhere.

### Frontend — React 18 + Vite + Tailwind
- Layout: [`AdminLayout.tsx`](dental-lab-crm/frontend/src/components/layout/AdminLayout.tsx) and [`ClientLayout.tsx`](dental-lab-crm/frontend/src/components/layout/ClientLayout.tsx) define the floating sidebars (icon-only). The bottom-nav for mobile is [`MobileBottomNav.tsx`](dental-lab-crm/frontend/src/components/layout/MobileBottomNav.tsx) with a center FAB.
- Routes: [`App.tsx`](dental-lab-crm/frontend/src/App.tsx) lazy-loads every page, wrapped in `<AuthGuard allowedRoles=[...]>`.
- State: Zustand stores under [`store/`](dental-lab-crm/frontend/src/store/) (mainly `authStore`). TanStack Query is installed but used sparingly — most pages call services in `useEffect`.
- HTTP: [`services/api.ts`](dental-lab-crm/frontend/src/services/api.ts) wraps axios with JWT injection and refresh-on-401. **Its `get<T>` / `post<T>` etc. return `Promise<T>` — they already unwrap `.data`.** Do not do `(await api.get(...)).data`.
- 3D viewer: `Dental3DViewer.tsx` uses Three.js directly for PLY/STL with vertex colors. Right-click rotate, left-click pan, scroll zoom. Sand-beige model on violet `#5D5A87` background.
- i18n: [`i18n/locales/{it,en,fr,he}.json`](dental-lab-crm/frontend/src/i18n/locales/). Run `npm run i18n:check` before merging key changes. HE flips `<html dir="rtl">` automatically (see `App.tsx`).

### Database — Prisma
Schema at [`backend/prisma/schema.prisma`](dental-lab-crm/backend/prisma/schema.prisma). Key models:
- `Case` has `verificationStatus` (`pending|incomplete|verified|not_required`) used by the WhatsApp verifier, plus `verificationNotes`.
- `CaseTooth` keys are FDI numbers (11–48). `workType` ∈ `corona|protesi|impianto|bite|maryland|intarsio|faccetta|altro`; `material` ∈ `ZR|EMAX|PMMA|RES|CR_CO|CERAM|COMP|ALT`.
- `PriceListItem` is unique on `(priceListId, workType, material)` so the price lists page renders as a matrix.
- Agent Pack tables: `llm_audit_log`, `whatsapp_messages`, `whatsapp_templates`.

## Conventions / pitfalls discovered the hard way

- **Two sidebar files.** [`Sidebar.tsx`](dental-lab-crm/frontend/src/components/layout/Sidebar.tsx) exists but is **dead** — the real nav lives inside [`AdminLayout.tsx`](dental-lab-crm/frontend/src/components/layout/AdminLayout.tsx)'s own `navItems` array. Add new admin entries there. Mobile entries go in [`MobileBottomNav.tsx`](dental-lab-crm/frontend/src/components/layout/MobileBottomNav.tsx) `AdminMobileNav` (only 4 slots + FAB).
- **`backend/.dockerignore` is mandatory.** It excludes `node_modules` and `dist`. Without it, `COPY . .` in the Dockerfile overwrites the just-generated Prisma client with the local Windows version, and new models silently disappear from `PrismaService` types (you'll see `Property 'lLMAuditLog' does not exist`).
- **Prisma model name conversion only lowercases the first letter.** `model LLMAuditLog` becomes `prisma.lLMAuditLog`, `model WhatsAppMessage` becomes `prisma.whatsAppMessage`. This looks wrong but is correct.
- **Auth guards are intentionally disabled** while the app is in private build mode (`@UseGuards(AuthGuard('jwt'))` is commented out in many controllers, and the axios interceptor returns `{ data: null }` on 401 in DEV). Real auth (email/pwd + JWT 30d) is planned before production. Don't re-enable guards without coordination.
- **`Case.dueDate` is optional.** Backend column is nullable, frontend types use `string | undefined`. Never invent a fallback date — render `—` and skip date-driven filters/sorts when missing.
- **Vercel needs the SPA catch-all rewrite** in [`frontend/vercel.json`](dental-lab-crm/frontend/vercel.json) (`/(.*) → /index.html`) because the explicit `/api` and `/socket.io` rewrites disable Vercel's automatic SPA fallback; without it, deep links return a Vercel 404.
- **Gemini sometimes returns trailing content after a JSON body.** Use the brace-counting `extractFirstJsonObject` in [`gemini-vision.client.ts`](dental-lab-crm/backend/src/modules/vision-import/clients/gemini-vision.client.ts), not a greedy `/\{[\s\S]*\}/` regex.

## Deploy

- **Frontend**: pushed to `main` → Vercel auto-deploys ([gestionale-shen3d.vercel.app](https://gestionale-shen3d.vercel.app)).
- **Backend**: lives on a VPS at `/home/hermes-workspace/projects/GESTIONALE-SHEN3D/dental-lab-crm` behind Nginx + HTTPS on `api.shen3d.com`. Standard deploy:
  ```bash
  ssh root@76.13.143.199
  cd /home/hermes-workspace/projects/GESTIONALE-SHEN3D/dental-lab-crm
  git pull origin main
  docker compose build backend && docker compose up -d backend
  docker compose exec backend npx prisma db push   # if schema changed
  ```
- **Schema changes** require a full rebuild (not just restart) so `npx prisma generate` runs against the new schema inside the container. Use `--no-cache` if a previous failed build cached a bad layer.

## Domain reference (FDI numbering)

```
Upper right (palatal)         |   Upper left (palatal)
18 17 16 15 14 13 12 11       |   21 22 23 24 25 26 27 28
------------------------------+--------------------------
48 47 46 45 44 43 42 41       |   31 32 33 34 35 36 37 38
Lower right                   |   Lower left
```

Case status flow: `received → in_progress → qc → shipped`. Priority: `normal | urgent | rush`. Overdue indicator fires when `dueDate < now()` and status ≠ `shipped`.

## Memory & continuity

When working across sessions, check `C:\Users\rsciu\.claude\projects\c--Users-rsciu-claude-project-Gestionale-Shen3D\memory\MEMORY.md` first — it tracks user preferences, deploy infrastructure, the WhatsApp/Vision rollout state, and other context not visible from the code alone.
