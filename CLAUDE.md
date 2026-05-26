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
  - `documents` — **Billing module** (Fase B + Fase C). CRUD on `Document` with PDF generation (pdfkit) and invoice4u SOAP sync. Endpoints under `/api/documents/*`: `from-cases`, `:id/issue`, `:id/cancel`, `:id/pdf` (redirects to `newview.invoice4u.co.il` only when synced against staging/production — local PDF otherwise), `preview-report` (PDF report "da approvare" raggruppato per mese), `invoice4u/verify` (read-only token check), `invoice4u/status`. Local document numbering uses prefixes from `TYPE_TO_PREFIX`: `PRV` (price_quote), `ISK` (invoice_order), `MAS` (tax_invoice), `KAB` (receipt), `MK` (receipt_invoice), `ZKU` (credit_note).
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
- `Case` has `verificationStatus` (`pending|incomplete|verified|not_required`) used by the WhatsApp verifier, plus `verificationNotes`. `billedAt` is set by `DocumentsService.issue()` when a billable document is emitted (and cleared on cancel) — drives the "Da fatturare" filter.
- `CaseTooth` keys are FDI numbers (11–48). `workType` ∈ `corona|protesi|impianto|bite|maryland|intarsio|faccetta|altro`; `material` ∈ `ZR|EMAX|PMMA|RES|CR_CO|CERAM|COMP|ALT`.
- `PriceListItem` is unique on `(priceListId, workType, material)` so the price lists page renders as a matrix.
- `Document` has `apiIdentifier` (UUID, sent to invoice4u for idempotency), `items` (JSON array), `payments` (JSON array — required when type ∈ `receipt | receipt_invoice | credit_note`), plus six `invoice4u*` fields populated by the sync. `Client.invoice4uCustomerId` caches the customer ID after first sync.
- Agent Pack tables: `llm_audit_log`, `whatsapp_messages`, `whatsapp_templates`.

### Invoice4u integration (Fase C)
Lives under [`backend/src/modules/documents/invoice4u/`](dental-lab-crm/backend/src/modules/documents/invoice4u/). Two implementations of the `Invoice4uClient` interface, selected at boot by the factory in `documents.module.ts`:
- `MockInvoice4uClient` — fake data, zero network. Default when `INVOICE4U_MODE=mock`.
- `SoapInvoice4uClient` — real SOAP calls via the `soap` npm library. Target chosen by `INVOICE4U_MODE`: `staging` → `apiqa.invoice4u.co.il`, `production` → `api.invoice4u.co.il`. Lazy-inits the WSDL client + caches `OrganizationID` from `IsAuthenticated`. Auto-sync is gated by `INVOICE4U_AUTO_SYNC=true`; setting `INVOICE4U_DRY_RUN=true` builds the SOAP payload, logs it, but **does not send** — useful for safely validating the wiring against production without emitting fiscal documents.
- `TYPE_TO_INVOICE4U_TYPE` in `invoice4u.types.ts` maps our local DocumentType to invoice4u's numeric enum (`1` Invoice / `2` Receipt / `3` CreditNote / `4` ReceiptInvoice / `6` InvoiceOrder / `10` PriceQuote). **These numbers were wrong in the first commit — they come from the official skill `invoice4u api`, double-check there before adding new types.**
- API tokens are generated at `https://private.invoice4u.co.il` → Settings → Account Settings → API → Generate. **Only one token active at a time per account**; regenerating revokes the old one. Staging and production are separate invoice4u environments — a token generated on the public portal works only against `api.invoice4u.co.il` (production). Staging requires a separate account from invoice4u support.

## Conventions / pitfalls discovered the hard way

- **Two sidebar files.** [`Sidebar.tsx`](dental-lab-crm/frontend/src/components/layout/Sidebar.tsx) exists but is **dead** — the real nav lives inside [`AdminLayout.tsx`](dental-lab-crm/frontend/src/components/layout/AdminLayout.tsx)'s own `navItems` array. Add new admin entries there. Mobile entries go in [`MobileBottomNav.tsx`](dental-lab-crm/frontend/src/components/layout/MobileBottomNav.tsx) `AdminMobileNav` (only 4 slots + FAB).
- **`backend/.dockerignore` is mandatory.** It excludes `node_modules` and `dist`. Without it, `COPY . .` in the Dockerfile overwrites the just-generated Prisma client with the local Windows version, and new models silently disappear from `PrismaService` types (you'll see `Property 'lLMAuditLog' does not exist`).
- **Prisma model name conversion only lowercases the first letter.** `model LLMAuditLog` becomes `prisma.lLMAuditLog`, `model WhatsAppMessage` becomes `prisma.whatsAppMessage`. This looks wrong but is correct.
- **Auth guards are intentionally disabled** while the app is in private build mode (`@UseGuards(AuthGuard('jwt'))` is commented out in many controllers, and the axios interceptor returns `{ data: null }` on 401 in DEV). Real auth (email/pwd + JWT 30d) is planned before production. Don't re-enable guards without coordination.
- **`Case.dueDate` is optional.** Backend column is nullable, frontend types use `string | undefined`. Never invent a fallback date — render `—` and skip date-driven filters/sorts when missing.
- **Vercel needs the SPA catch-all rewrite** in [`frontend/vercel.json`](dental-lab-crm/frontend/vercel.json) (`/(.*) → /index.html`) because the explicit `/api` and `/socket.io` rewrites disable Vercel's automatic SPA fallback; without it, deep links return a Vercel 404.
- **Gemini sometimes returns trailing content after a JSON body.** Use the brace-counting `extractFirstJsonObject` in [`gemini-vision.client.ts`](dental-lab-crm/backend/src/modules/vision-import/clients/gemini-vision.client.ts), not a greedy `/\{[\s\S]*\}/` regex.
- **`backend/.env.production` is tracked in git** (intentional, holds defaults + secrets-as-placeholders), but on the VPS the file has real secrets edited in-place. Always `git stash` before `git pull` on the VPS, then `git stash pop` after — otherwise pull aborts with "Your local changes would be overwritten". The placeholder lines in the committed file are safe to merge with the real values because edits only touch `KEY=value` lines, not the structure.
- **invoice4u SOAP responses put business errors INSIDE the body even on HTTP 200.** `SoapInvoice4uClient.assertNoErrors` checks `result.Errors[]` after every call — don't bypass it. The `verify` endpoint returns `{ valid: false, error: "..." }` instead of throwing, so the UI can show a friendly message.
- **Document PDF redirect is conditional on environment.** The `:id/pdf` endpoint redirects to `newview.invoice4u.co.il` only when `invoice4uEnvironment` is `staging` or `production` — for `mock` (or unsynced docs) it serves the local pdfkit PDF with a yellow/red watermark. Don't strip this check unless you also fix the watermark logic in `documents.pdf.service.ts`.
- **`docker compose restart backend` does NOT rebuild.** After a `git pull` on the VPS you must `docker compose build backend --no-cache && docker compose up -d backend`. Restart alone keeps the old image — symptom: `invoice4u/verify` keeps returning `environment: "mock"` even when `.env.production` says `staging`.

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

### Env vars cheatsheet (billing / invoice4u)
Backend `.env.production` flags that control the Fase C rollout. Defaults are safe (mock, no sync, no fiscal emission):
- `INVOICE4U_MODE` = `mock` | `staging` | `production` — picks the client implementation
- `INVOICE4U_TOKEN` — GUID from `private.invoice4u.co.il` (required for non-mock modes)
- `INVOICE4U_AUTO_SYNC` = `true|false` — gate the auto-call from `DocumentsService.issue()`; off ⇒ documents stay local-only with a `DRAFT-…` number
- `INVOICE4U_DRY_RUN` = `true|false` — when on, the SOAP client logs the payload it WOULD send and returns synthetic data; useful to validate the wiring against production safely
- `INVOICE4U_DEFAULT_TAX_RATE` — fallback tax % when `SystemSettings.default_tax_rate` is missing (defaults to `18`)

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
