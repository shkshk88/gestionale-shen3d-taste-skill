# Guida al Deploy - Shen3D Dental Lab CRM

## Prerequisiti

- Node.js 18+ (consigliato 20 LTS)
- Database PostgreSQL (consigliato per produzione) o SQLite (per test)
- Account Google Cloud Platform (per OAuth)
- VPS/Server con accesso SSH (consigliato: Ubuntu 22.04 LTS)

## Configurazione Google OAuth

### 1. Creare Progetto Google Cloud
1. Vai su https://console.cloud.google.com/
2. Crea un nuovo progetto "Shen3D Dental Lab CRM"
3. Abilita le API:
   - Google+ API
   - Google Identity Toolkit API

### 2. Configurare OAuth Consent Screen
1. Menu "OAuth consent screen" → External → Create
2. Compila:
   - App name: Shen3D Dental Lab CRM
   - User support email: support@shen3d.com
   - Developer contact: admin@shen3d.com
3. Scopes: aggiungi `email` e `profile`
4. Test users: aggiungi le email degli utenti creati

### 3. Creare Credenziali OAuth 2.0
1. Credentials → Create Credentials → OAuth client ID
2. Application type: Web application
3. Name: Shen3D Web Client
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (sviluppo)
   - `https://api.tuodominio.com/api/auth/google/callback` (produzione)
5. Salva Client ID e Client Secret

## Configurazione Backend

### File `.env.production` (backend)
```env
# JWT Configuration
JWT_SECRET=genera-un-token-lungo-e-sicuro-minimo-32-caratteri

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=https://tuodominio.com

# Backend Port
PORT=3000

# Database (PostgreSQL consigliato)
DATABASE_URL=postgresql://user:password@localhost:5432/dental_crm

# Ambiente
NODE_ENV=production

# Email (opzionale, per notifiche)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Configurazione Frontend

### File `.env.production` (frontend)
```env
VITE_API_URL=https://api.tuodominio.com/api
VITE_DISABLE_AUTO_LOGIN=true
VITE_APP_NAME=Shen3D Dental Lab CRM
VITE_SUPPORT_EMAIL=support@shen3d.com
```

## Deploy su VPS

### 1. Preparare il Server
```bash
# Update sistema
sudo apt update && sudo apt upgrade -y

# Installare Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installare PM2 per gestire i processi
sudo npm install -g pm2

# Installare PostgreSQL (se usato)
sudo apt install postgresql postgresql-contrib -y
```

### 2. Setup Database PostgreSQL
```bash
sudo -u postgres psql

CREATE DATABASE dental_crm;
CREATE USER dentaluser WITH ENCRYPTED PASSWORD 'tua-password-sicura';
GRANT ALL PRIVILEGES ON DATABASE dental_crm TO dentaluser;
\q
```

### 3. Deploy Backend
```bash
# Clona repository
git clone https://github.com/tuorepo/dental-lab-crm.git
cd dental-lab-crm/backend

# Installa dipendenze
npm install

# Configura ambiente
cp .env.production .env
# Modifica .env con i tuoi valori

# Genera Prisma client
npx prisma generate

# Esegui migrazioni database
npx prisma migrate deploy

# Popola database con dati iniziali
npx prisma db seed

# Build per produzione
npm run build

# Avvia con PM2
pm2 start dist/main.js --name "shen3d-backend"
pm2 save
pm2 startup
```

### 4. Deploy Frontend
```bash
cd ../frontend

# Installa dipendenze
npm install

# Configura ambiente
cp .env.production .env
# Modifica .env con i tuoi valori

# Build per produzione
npm run build

# Copia build su web server (nginx/apache)
sudo cp -r dist/* /var/www/html/
```

### 5. Configurazione Nginx
```nginx
# /etc/nginx/sites-available/shen3d

server {
    listen 80;
    server_name tuodominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tuodominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Utenti Pre-configurati

Dopo il seed, questi utenti sono disponibili:

### Admin Gestionale
| Email | Ruolo | Password |
|-------|-------|----------|
| admin@shen3d.com | admin | (login con Google) |
| manager@shen3d.com | admin | (login con Google) |

### Portale Clienti
| Email | Studio | Ruolo |
|-------|--------|-------|
| admin@shenart.it | SHENART Dental Studio | client |
| admin@alphadent.it | ALPHADENT Studio | client |
| test@example.com | TEST Studio (Interno) | client |

## Note Importanti

### Sviluppo vs Produzione
- **NON** usare SQLite in produzione con dati reali
- **NON** condividere il JWT_SECRET
- **NON** committare i file .env con credenziali reali

### Backup Database
```bash
# Backup PostgreSQL
pg_dump -U dentaluser dental_crm > backup_$(date +%Y%m%d).sql

# Restore PostgreSQL
psql -U dentaluser dental_crm < backup_20240205.sql
```

### Aggiornamenti
```bash
# Pull nuovi cambiamenti
git pull origin main

# Aggiorna dipendenze
npm install

# Esegui migrazioni
npx prisma migrate deploy

# Ricarica PM2
pm2 reload shen3d-backend
```

## Supporto
Per problemi durante il deploy, controlla:
1. Log backend: `pm2 logs shen3d-backend`
2. Log nginx: `sudo tail -f /var/log/nginx/error.log`
3. Database: `sudo -u postgres psql -d dental_crm`
