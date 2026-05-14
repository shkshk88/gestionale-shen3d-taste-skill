# 🚀 GUIDA DEPLOY - Accesso Remoto con Login Reali

## 📋 PREREQUISITI

1. **Google Cloud Console Account** (per OAuth)
2. **Dominio/Hosting** (frontend e backend)
3. **Database PostgreSQL** (consigliato per produzione)
4. **Storage Files** (AWS S3, Cloudflare R2, o simile)

---

## 🔧 STEP 1: Configurare Google OAuth

### 1.1 Crea progetto Google Cloud
1. Vai a https://console.cloud.google.com/
2. Crea un nuovo progetto "Shen3D Dental CRM"
3. Abilita API: **Google+ API** e **Google People API**

### 1.2 Configura OAuth Consent Screen
1. Menu → APIs & Services → OAuth consent screen
2. Scegli **External** (per testing con utenti reali)
3. Compila:
   - App name: `Shen3D Dental Lab CRM`
   - User support email: `tuo-email@gmail.com`
   - Developer contact: `tuo-email@gmail.com`
4. Scopes: Aggiungi `openid`, `email`, `profile`
5. Test users: Aggiungi gli email che useranno il sistema

### 1.3 Crea Credentials
1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: **Web application**
4. Name: `Shen3D Web Client`
5. Authorized JavaScript origins:
   - `https://tuo-dominio-frontend.com`
   - `http://localhost:5173` (per dev)
6. Authorized redirect URIs:
   - `https://tuo-dominio-backend.com/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (per dev)
7. Salva **Client ID** e **Client Secret**

---

## 🖥️ STEP 2: Deploy Backend

### 2.1 Configura Environment
```bash
cd backend
cp .env.production .env
# Modifica .env con i tuoi valori
```

**File .env:**
```env
JWT_SECRET=genera-stringa-casuale-32-caratteri
GOOGLE_CLIENT_ID=tuo-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tuo-client-secret
FRONTEND_URL=https://tuo-dominio-frontend.com
PORT=3000
```

### 2.2 Build e Deploy

**Opzione A: Railway (Consigliato per iniziare)**
1. Crea account su https://railway.app/
2. New Project → Deploy from GitHub repo
3. Aggiungi variabili d'ambiente nel dashboard
4. Railway fornisce URL automatico

**Opzione B: Render**
1. https://render.com/ → New Web Service
2. Connect GitHub repo
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start:prod`
5. Aggiungi env variables

**Opzione C: VPS (DigitalOcean, AWS, etc.)**
```bash
# Installa Node.js 20+
# Clona repo
git clone <tuo-repo>
cd dental-lab-crm/backend

# Installa dipendenze
npm install

# Build
npm run build

# Avvia con PM2
npm install -g pm2
pm2 start dist/main.js --name "shen3d-backend"
pm2 startup
pm2 save
```

### 2.3 Configura Database (PostgreSQL)

**Se usi Railway:** Database incluso automatico

**Se usi Render:** Crea PostgreSQL nel dashboard

**Se usi VPS:**
```bash
# Installa PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crea database
sudo -u postgres psql
CREATE DATABASE dental_crm;
CREATE USER shen3d WITH PASSWORD 'tua-password';
GRANT ALL PRIVILEGES ON DATABASE dental_crm TO shen3d;
\q

# Aggiorna .env
DATABASE_URL=postgresql://shen3d:tua-password@localhost:5432/dental_crm
```

**Migrazioni:**
```bash
npx prisma migrate deploy
npx prisma db seed  # Opzionale: dati iniziali
```

---

## 🎨 STEP 3: Deploy Frontend

### 3.1 Configura Environment
```bash
cd frontend
cp .env.production .env
# Modifica .env:
VITE_API_URL=https://tuo-dominio-backend.com/api
```

### 3.2 Build
```bash
npm install
npm run build
```

### 3.3 Deploy

**Opzione A: Vercel (Consigliato)**
1. https://vercel.com/ → Import GitHub repo
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables: `VITE_API_URL`

**Opzione B: Netlify**
1. https://netlify.com/ → Add new site
2. Connect GitHub
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Environment variables nel dashboard

**Opzione C: Static Hosting**
```bash
# Dopo npm run build, upload cartella 'dist' su:
# - AWS S3 + CloudFront
# - Cloudflare Pages
# - Nginx server
```

---

## 🔐 STEP 4: Configurare Utenti Reali

### 4.1 Primo Accesso Admin
1. Vai al tuo dominio frontend: `https://tuo-dominio.com/admin`
2. Clicca "Login with Google"
3. Usa l'email che hai configurato come admin nel database

**Se non hai un admin nel database:**
```bash
# Esegui nel backend
cd backend
npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
  const user = await prisma.user.create({
    data: {
      email: 'tuo-email-admin@gmail.com',
      name: 'Admin Shen3D',
      role: 'admin',
      language: 'it',
    }
  });
  console.log('Admin creato:', user);
}

createAdmin();
"
```

### 4.2 Creare Clienti (Dentisti)
1. Accedi come Admin
2. Vai su "Clienti" → "Nuovo Cliente"
3. Inserisci dati studio dentistico
4. L'email del cliente servirà per il login Google

### 4.3 Associare Utenti Cliente
Quando un dentista fa login con Google per la prima volta:
1. Il sistema crea automaticamente l'utente
2. Tu devi associarlo al cliente corretto dal pannello admin
3. Vai su "Utenti" → Trova l'utente → Modifica → Assegna Cliente

---

## 🧪 STEP 5: Testing Pre-Deploy

### Test in locale con produzione simulata:
```bash
# 1. Backend
 cd backend
 cp .env.production .env
 # Modifica FRONTEND_URL=http://localhost:5173
 npm run start:prod

# 2. Frontend (nuovo terminale)
cd frontend
npm run build
npm run preview  # Serve la build di produzione
```

### Verifiche:
- [ ] Login Google funziona
- [ ] Redirect corretto dopo login
- [ ] Creazione caso funziona
- [ ] Upload file funziona
- [ ] Visualizzatore 3D funziona
- [ ] Chat funziona
- [ ] Notifiche funzionano

---

## 🚨 TROUBLESHOOTING

### Errore: "redirect_uri_mismatch"
- Verifica che l'URI in Google Cloud Console sia esattamente uguale a quello del backend
- Include `/api/auth/google/callback`

### Errore CORS
- Verifica `FRONTEND_URL` nel backend .env
- Deve matchare esattamente il dominio frontend (con https)

### Utente non ha clientId
- Verifica che l'utente sia associato a un cliente nel database
- Controlla tabella `users` → campo `clientId`

### Database non connesso
- Verifica `DATABASE_URL` formato corretto
- Assicurati che il database sia accessibile dal server backend

---

## 📱 URL FINALI DOPO DEPLOY

**Frontend (Admin):**
```
https://tuo-dominio.com/admin
```

**Frontend (Portale Clienti):**
```
https://tuo-dominio.com/portal
```

**Backend API:**
```
https://tuo-dominio-backend.com/api
```

**Swagger Docs:**
```
https://tuo-dominio-backend.com/api/docs
```

---

## 💰 COSTI STIMATI (Mensili)

| Servizio | Costo |
|----------|-------|
| Railway (Backend + DB) | $5-20 |
| Vercel (Frontend) | $0 (gratis) |
| Google Cloud OAuth | $0 (gratis fino a 10k utenti) |
| Storage Files (opzionale) | $5-10 |
| **Totale** | **$10-30/mese** |

---

## ✅ CHECKLIST PRE-LANCIO

- [ ] Google OAuth configurato con domini corretti
- [ ] Backend deployato e testato
- [ ] Frontend deployato e testato
- [ ] Database migrato e funzionante
- [ ] Almeno 1 admin creato nel database
- [ ] Almeno 1 cliente creato con utente associato
- [ ] File storage configurato (se necessario)
- [ ] Email notifiche configurate (opzionale)
- [ ] HTTPS abilitato su tutti i domini
- [ ] Testato login con Google reale

---

**🎉 Dopo questi step, il sistema è pronto per l'uso reale!**

Per supporto: consulta il file `CLAUDE.md` o contatta il developer.
