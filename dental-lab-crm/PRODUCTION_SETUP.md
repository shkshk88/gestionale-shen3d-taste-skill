# 🚀 CONFIGURAZIONE PRODUZIONE - RIEPILOGO

## ✅ Cosa è stato configurato

### 1. Frontend (`frontend/.env.production`)
```env
VITE_API_URL=https://tuo-backend.com/api
VITE_DISABLE_AUTO_LOGIN=true
```

**Modifiche al codice:**
- ✅ `authStore.ts`: Supporto per `VITE_DISABLE_AUTO_LOGIN`
- ✅ Disabilita auto-login in produzione
- ✅ Mantiene auto-login in dev per comodità

### 2. Backend (`backend/.env.production`)
```env
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=https://tuo-frontend.com
```

**Modifiche al codice:**
- ✅ `main.ts`: CORS configurato per usare `FRONTEND_URL`
- ✅ Supporto multi-porta (5173, 5174, 5175) per dev

### 3. Guide create
- ✅ `DEPLOY_GUIDE.md`: Guida completa step-by-step
- ✅ `deploy.sh`: Script automatizzato per deploy
- ✅ `PRODUCTION_SETUP.md`: Questo file riepilogo

---

## 🎯 Prossimi Passi per Deploy

### Step 1: Prepara Google OAuth (15 min)
1. Vai su https://console.cloud.google.com/
2. Crea progetto → Abilita Google+ API
3. Configura OAuth Consent Screen (External)
4. Crea OAuth Client ID (Web application)
5. Aggiungi redirect URI:
   - `https://tuo-backend.com/api/auth/google/callback`
6. Copia **Client ID** e **Client Secret**

### Step 2: Deploy Backend (10 min)
**Opzione A - Railway (consigliato):**
1. https://railway.app/ → New Project
2. Deploy from GitHub repo
3. Aggiungi env variables nel dashboard
4. Ottieni URL backend (es: `https://shen3d-api.up.railway.app`)

**Opzione B - Render:**
1. https://render.com/ → New Web Service
2. Connect GitHub
3. Build: `npm install && npm run build`
4. Start: `npm run start:prod`
5. Aggiungi env variables

### Step 3: Deploy Frontend (5 min)
**Vercel (consigliato):**
1. https://vercel.com/ → Import GitHub
2. Framework: Vite
3. Build: `npm run build`
4. Output: `dist`
5. Env: `VITE_API_URL=https://tuo-backend.com/api`

### Step 4: Configura Dominio (opzionale)
- Aggiungi dominio custom su Vercel (frontend)
- Configura DNS per puntare al deploy

### Step 5: Test (10 min)
1. Vai al frontend: `https://tuo-frontend.com`
2. Clicca "Login with Google"
3. Verifica redirect funzioni
4. Test creazione caso
5. Test upload file

---

## 🔧 Configurazioni da Modificare

### Per il tuo dominio reale:

**1. `frontend/.env.production`:**
```env
VITE_API_URL=https://api.tuodominio.com/api
```

**2. `backend/.env` (su server):**
```env
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
FRONTEND_URL=https://tuodominio.com
JWT_SECRET=genera-stringa-lunga-e-casuale
```

**3. Google Cloud Console:**
- Authorized origins: `https://tuodominio.com`
- Authorized redirect: `https://api.tuodominio.com/api/auth/google/callback`

---

## 🧪 Test Locale Prima del Deploy

```bash
# 1. Configura backend per test locale
cd backend
cp .env.production .env
# Modifica FRONTEND_URL=http://localhost:4173
npm run start:prod

# 2. Configura frontend
cd frontend
# Crea .env:
# VITE_API_URL=http://localhost:3000/api
# VITE_DISABLE_AUTO_LOGIN=true
npm run build
npm run preview

# 3. Testa su http://localhost:4173
# Dovrebbe chiedere login Google reale
```

---

## 📱 URL Finali (Esempio)

| Servizio | URL Esempio |
|----------|---------------|
| Frontend | `https://shen3d.vercel.app` |
| Backend | `https://shen3d-api.railway.app` |
| Admin | `https://shen3d.vercel.app/admin` |
| Portale | `https://shen3d.vercel.app/portal` |
| API Docs | `https://shen3d-api.railway.app/api/docs` |

---

## 💡 Consigli

1. **Inizia con Railway + Vercel**: Gratuito e facile
2. **Usa email test Google**: Aggiungi il tuo email come test user in Google Cloud
3. **Testa in locale prima**: Usa `npm run preview` per testare la build
4. **Backup database**: Configura backup automatici su Railway/Render
5. **Monitora errori**: Aggiungi Sentry o LogRocket per tracciare errori

---

## 🆘 Troubleshooting Comune

**"Invalid redirect_uri"**
→ Verifica che l'URI in Google Cloud matchi esattamente con il backend

**"CORS error"**
→ Verifica `FRONTEND_URL` nel backend includa `https://`

**"Utente non ha clientId"**
→ Devi associare l'utente al cliente nel database (dal pannello admin)

**"Database connection failed"**
→ Verifica `DATABASE_URL` formato corretto

---

## 📞 Hai bisogno di aiuto?

1. Leggi la [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) completa
2. Verifica i log del backend: `railway logs` o `render logs`
3. Controlla console browser per errori frontend
4. Verifica network tab per chiamate API fallite

---

**🎉 Una volta configurato, il sistema è pronto per ricevere feedback dai tuoi clienti!**
