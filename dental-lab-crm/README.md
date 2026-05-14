# Shen3D - Dental Lab CRM

Sistema CRM completo per laboratorio odontotecnico con gestione casi, portale clienti dedicato ai dentisti, visualizzatore 3D avanzato per file STL/PLY, chat per caso, calendario consegne e gestione listini prezzi.

## Tecnologie

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Three.js + React Three Fiber (visualizzatore 3D)
- Zustand (state management)
- TanStack Query
- i18next (IT, EN, FR, HE)

### Backend
- NestJS + TypeScript
- PostgreSQL + Prisma ORM
- Socket.io (real-time chat)
- Passport.js (Google OAuth)
- JWT Authentication

## Requisiti

- Node.js 20+
- Docker e Docker Compose
- npm o yarn

## Setup Rapido

### 1. Avvia i servizi Docker

```bash
cd dental-lab-crm
docker-compose up -d
```

Questo avvia:
- PostgreSQL (porta 5432)
- Redis (porta 6379)
- MinIO S3 (porte 9000, 9001)

### 2. Configura le variabili d'ambiente

```bash
cp .env.example .env
# Modifica .env con le tue credenziali Google OAuth
```

### 3. Setup Backend

```bash
cd backend
npm install

# Genera client Prisma
npm run prisma:generate

# Esegui migrazioni database
npm run prisma:migrate

# Popola database con dati demo
npm run prisma:seed

# Avvia server development
npm run start:dev
```

Il backend sarà disponibile su http://localhost:3000
Swagger docs: http://localhost:3000/api/docs

### 4. Setup Frontend

```bash
cd frontend
npm install

# Avvia server development
npm run dev
```

Il frontend sarà disponibile su http://localhost:5173

## Struttura Progetto

```
dental-lab-crm/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Componenti UI
│   │   ├── pages/          # Pagine (admin + client portal)
│   │   ├── store/          # Zustand stores
│   │   ├── i18n/           # Traduzioni
│   │   └── types/          # TypeScript types
│   └── ...
├── backend/                # NestJS backend
│   ├── src/
│   │   ├── modules/        # Moduli (auth, cases, clients, etc.)
│   │   └── prisma/         # Prisma service
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.ts         # Seed data
├── docker-compose.yml      # PostgreSQL, Redis, MinIO
└── .env.example            # Template variabili ambiente
```

## Utenti Demo (dopo seed)

| Email | Ruolo | Note |
|-------|-------|------|
| admin@shen3d.com | Admin | Accesso completo |
| operatore@shen3d.com | Operator | Accesso gestionale |
| mario.rossi@clinicarossi.it | Client | Portale clienti |
| anna.verdi@drverdi.it | Client | Portale clienti |

## Funzionalità Principali

### Area Gestionale (Admin/Operator)
- Dashboard con statistiche e consegne del giorno
- Gestione casi con schema dentale FDI interattivo
- Visualizzatore 3D per file STL/PLY
- Chat integrata per ogni caso
- Calendario consegne (vista settimanale/mensile)
- Gestione clienti e listini prezzi
- Sistema notifiche

### Portale Clienti (Dentisti)
- Dashboard con casi attivi
- Invio nuovo caso guidato step-by-step
- Visualizzazione stato casi
- Chat con il laboratorio
- Upload file 3D

## Scripts Utili

### Backend
```bash
npm run start:dev      # Avvia in dev mode
npm run build          # Build produzione
npm run prisma:studio  # Apri Prisma Studio (GUI database)
npm run prisma:migrate # Esegui migrazioni
npm run prisma:seed    # Popola database
```

### Frontend
```bash
npm run dev      # Avvia dev server
npm run build    # Build produzione
npm run preview  # Preview build
npm run lint     # Lint codice
```

## Lingue Supportate

- Italiano (IT) - default
- English (EN)
- Français (FR)
- עברית (HE) - con supporto RTL

## Note per Produzione

1. Configura Google OAuth con le credenziali di produzione
2. Usa un database PostgreSQL managed (Supabase, AWS RDS, etc.)
3. Configura storage S3 (Cloudflare R2, AWS S3) per i file
4. Imposta le variabili d'ambiente di produzione
5. Abilita HTTPS

## Licenza

Proprietario - Tutti i diritti riservati
© 2025 Shen3D Lab
