# 🦷 Dental Lab CRM - Sistema Gestionale

CRM completo per laboratorio odontotecnico con gestione casi, portale clienti per dentisti, visualizzatore 3D STL/PLY, chat per caso e calendario consegne.

**Target**: Piccolo laboratorio (2-3 utenti interni + ~10 clienti)
**Lingue**: IT, EN, FR, HE

---

## 🎯 Obiettivi

1. Digitalizzare il flusso di lavoro del laboratorio
2. Portale self-service per dentisti (invio/tracciamento casi)
3. Chat dedicata per caso con visualizzatore 3D
4. Automatizzare notifiche e gestione tempi di consegna
5. Centralizzare gestione listini prezzi

---

## ✨ Funzionalità Core

### Area Gestionale (Admin/Operator)
- **Dashboard**: Vista calendario, riassunto consegne, alert ritardi, metriche rapide
- **Gestione Casi**: Creazione con schema dentale FDI interattivo, upload file 3D/immagini, calcolo prezzi da listino
- **Schema Dentale FDI**: Selezione per dente di tipo lavorazione (corona, protesi, impianto, bite, etc.), materiale (ZR, EMAX, PMMA, etc.), colore VITA
- **Visualizzatore 3D**: Three.js con controlli rotazione/zoom/pan, toggle trasparenza/colore, multi-file overlay
- **Clienti**: Anagrafica completa, multi-utente per studio, storico casi
- **Calendario**: Viste settimanale/bisettimanale/mensile, panel consegne giornaliere
- **Listini Prezzi**: Multipli listini, tabella prezzi per tipo/materiale, assegnazione a cliente
- **Chat**: Thread per caso con upload file e viewer 3D inline

### Portale Clienti (Dentisti)
- **Dashboard**: Statistiche rapide, prossime consegne, azioni rapide
- **Nuovo Caso**: Form guidato 5 step (dati paziente → schema dentale → upload file → consegna → conferma)
- **I Miei Casi**: Lista con filtri, dettaglio con viewer 3D, chat integrata
- **Profilo**: Dati studio, preferenze lingua/notifiche

---

## 🗄️ Database Schema (Prisma)

```
USERS: id, email, name, role (admin/operator/client), google_id, language, client_id
CLIENTS: id, studio_name, contact_person, address, phone, email, whatsapp, vat_number, price_list_id
CASES: id, case_number (LAB-YYYY-NNNN), client_id, patient_name, status, priority, received_date, due_date, total_price
CASE_TEETH: id, case_id, tooth_number (FDI 11-48), work_type, material, vita_color, unit_price
CASE_FILES: id, case_id, file_name, file_path, file_type (image/stl/ply), file_size
CASE_MESSAGES: id, case_id, sender_id, message_text, message_type, file_id, is_read
PRICE_LISTS: id, list_name, is_default, valid_from
PRICE_LIST_ITEMS: id, price_list_id, work_type, material, unit_price
NOTIFICATIONS: id, user_id, type, title, message, is_read
```

---

## 🏗️ Stack Tecnico

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Lucide icons
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **3D**: Three.js + React Three Fiber + @react-three/drei
- **Calendario**: FullCalendar
- **Chat**: Socket.io client
- **i18n**: i18next (IT, EN, FR, HE + RTL)

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Passport.js + Google OAuth 2.0 + JWT
- **Storage**: Cloudflare R2 / AWS S3
- **Real-time**: Socket.io
- **Queue**: Bull + Redis
- **Email**: Nodemailer + SendGrid

---

## 📐 Schema FDI Denti

```
ARCATA SUPERIORE DESTRA    |    ARCATA SUPERIORE SINISTRA
18 17 16 15 14 13 12 11    |    21 22 23 24 25 26 27 28
---------------------------+---------------------------
48 47 46 45 44 43 42 41    |    31 32 33 34 35 36 37 38
ARCATA INFERIORE DESTRA    |    ARCATA INFERIORE SINISTRA
```

---

## 🎨 Materiali & Colori

| Codice | Materiale | Colore UI |
|--------|-----------|-----------|
| ZR | Zirconio | 🔵 Blu |
| EMAX | Disilicato di Litio | 🟣 Viola |
| PMMA | Polimetilmetacrilato | 🟡 Giallo |
| RES | Resina | 🟠 Arancione |
| CR-CO | Cromo-Cobalto | ⚫ Grigio |
| CERAM | Ceramica | 🟠 Arancione scuro |
| COMP | Composito | 🔵 Azzurro |

---

## 📊 Workflow Casi

```
RICEVUTO → IN LAVORAZIONE → QC → SPEDITO
   🔵           🟡           🟣       🟢
```

**Priorità**: Normale | Urgente (giallo) | Rush (rosso)
**Alert**: Icona 🔴 se `data_attuale > due_date` e stato ≠ "Spedito"

---

## 🔐 Sicurezza

- **Auth**: Google OAuth + JWT (Access 15min + Refresh 7gg)
- **Roles**: admin (full), operator (no settings), client (solo portale)
- **File**: Whitelist tipi, max 20MB (3D) / 10MB (img), UUID filename, signed URLs
- **Privacy**: GDPR compliant, HTTPS/TLS 1.3, bcrypt hash
- **Rate Limit**: 100 req/min autenticato, 10 req/min anonimo

---

## 🗂️ Struttura Progetto

```
dental-lab-crm/
├── frontend/
│   ├── src/
│   │   ├── components/   # common, layout, dental, viewer3d, chat
│   │   ├── pages/        # admin/, client/, auth/
│   │   ├── hooks/        # useAuth, useCases, useChat
│   │   ├── services/     # api, auth, case, file
│   │   ├── store/        # Zustand stores
│   │   └── i18n/         # locales (it, en, fr, he)
│   └── public/models/    # File 3D demo
├── backend/
│   └── src/
│       ├── modules/      # auth, users, clients, cases, files, chat
│       └── prisma/       # schema.prisma, seed.ts
└── docker-compose.yml
```

---

## 🎨 UI DESIGN V2 - ETHEREAL GLASS

**Proposta Design Aggiornata** (29 Gennaio 2025)

Evoluzione del design da "tema beige caldo" a un'interfaccia **"Ethereal Glass"** ispirata ai moderni **Bento Grids** e **Soft Gradients** con glassmorphism raffinato.

### 🌫️ Atmosfera & Sfondi

**Background Dinamico** con Mesh Gradients:
- Non più colore solido, ma sfere di colore sfocate che si fondono
- Palette: blu etereo, beige sabbia, verde menta desaturato
- Effetto profondità con `blur(40px)`

```css
.bg-mesh {
  background-color: #f3f4f6;
  background-image:
    radial-gradient(at 0% 0%, rgba(200, 220, 255, 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(255, 240, 200, 0.5) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(220, 255, 220, 0.3) 0px, transparent 50%);
  filter: blur(40px);
}
```

### 🍱 Layout Bento Box

**Struttura Modulare**:
- Dashboard organizzata a blocchi rettangolari/quadrati armonici
- **Rounded Corners Estremi**: `rounded-[2rem]` (32px) per look amichevole
- **Spacing generoso**: `gap-6` o `gap-8` per far respirare il design
- Griglia perfettamente bilanciata

### 🪟 Advanced Glassmorphism

**Card Multi-Layer**:
```tsx
// GlassCard Base
<div className="
  rounded-[2rem]
  bg-white/70              // Semitrasparente
  backdrop-blur-xl         // Blur effetto vetro
  border border-white/50   // Bordo luminoso
  shadow-[0_8px_30px_rgb(0,0,0,0.04)]  // Ombra soffice
  p-6
">
  {children}
</div>

// VibrantCard (Call-to-Action)
<div className="
  rounded-[2rem]
  bg-gradient-to-br from-blue-600 to-blue-500
  text-white
  shadow-lg shadow-blue-500/30
  p-6
">
  {children}
</div>
```

**Card Colorate**:
- Alcune tessere Bento devono essere piene e vibranti (blu, gialla, nera)
- Crea contrasto visivo e gerarchia nel design
- Es: Card "Nuovo Caso" in `bg-black text-white` o `bg-brand-primary`

### 🧭 Navigazione Floating

**Floating Sidebar**:
- Pillola verticale stondata sospesa a sinistra (non attaccata ai bordi)
- Icone minimal senza testo
- Stato attivo: cerchio morbido o rettangolo stondato

**Pill Tabs**:
- Navigazione superiore a "pillole"
- Sfondo scuro per tab attivo, trasparente per inattivo
- Simile a Salesforce UI

### 💎 Dettagli Preziosi

**Tipografia**:
- Titoli grandi, neri e bold (Inter Tight)
- Label piccole in grigio medio

**Icone**:
- Duotone o con sfondi circolari morbidi

**Chart Minimal**:
- Grafici dai colori pastello saturi (verde acido, blu elettrico)
- Sfondo bianco/vetro

### 🛠️ Implementazione

**Action Plan**:
1. Installare `clsx` e `tailwind-merge` per classi complesse
2. Aggiornare `index.css` con utility `bg-mesh` e nuovi gradienti
3. Modificare `Layout` per floating sidebar e sfondo dinamico
4. Creare componenti `GlassCard` e `VibrantCard`
5. Implementare transizioni layout con Framer Motion

**Status**: 📝 Proposta - Da implementare

---

## ✅ Implementazioni Complete (Gennaio 2025)

### Design System
- Tema beige/sabbia (`#FAF8F5`), sidebar icone 72px, cards con accenti colorati
- Glassmorphism effects, font Inter

### Pagine Complete
- Login, Admin Dashboard, Lista/Dettaglio Casi, Form Caso con schema FDI
- Lista/Dettaglio Clienti, Calendario (settimanale/bisettimanale/mensile)
- Gestione Listini, Reports, Notifiche, Impostazioni
- Portale Cliente (Dashboard, Nuovo Caso, I Miei Casi, Profilo)

### Visualizzatore 3D (`Dental3DViewer.tsx`)
- Caricamento PLY con coordinate originali, supporto vertex colors
- Controlli: DX=rotazione, SX=pan, scroll=zoom
- UI: toggle visibilità arcate, slider opacità, toggle colore, reset, screenshot, fullscreen
- Sfondo viola `#5D5A87`, colore modello Sand Beige `#C9B896`
- File demo: `/public/models/case-1/` e `/case-2/`

### Internazionalizzazione
- 4 lingue: IT, EN, FR, HE (con RTL support)

---

## 🔧 Fix Critici Recenti

### 28 Gennaio 2025
1. **Upload File NewCase**: Fixato input file nascosto con ref, upload dopo creazione caso
2. **Validazione ClientId**: Aggiunto fallback `user?.client?.id || user?.clientId`
3. **Fix Doppio `/api/`**: Separazione URL WebSocket vs REST in `useNotifications.ts` e `useChat.ts`
4. **Cache v3.0**: Auto-migration storage, tool `/clear-browser-cache.html`

### 29 Gennaio 2025
1. **Fix Calendario**: Usa UUID per routing (non caseNumber), fix timezone date
2. **Fix CaseNumber**: Generazione da ultimo numero (non count) per evitare duplicati
3. **Vista Mensile**: Griglia calendario completa 7x5/6 con indicatori colorati

---

## 🎯 Mantra

> "Semplice per l'utente, potente per il business"

**Versione**: 1.4 Compact | **Aggiornato**: 1 Febbraio 2025
