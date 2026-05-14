# Guida Deploy Completa - Hostinger VPS

## Architettura

```
shen3d.com (dominio su Network Solutions)
    ↓ DNS puntato a
Hostinger VPS (Ubuntu 22.04)
├── Nginx (reverse proxy + SSL)
├── Node.js + NestJS (backend API)
├── PostgreSQL (database)
├── PM2 (gestione processi)
└── /var/www/html (frontend React build)
```

---

## STEP 0: Trasferire Dominio (Puntare DNS)

### Opzione A: Cambiare Nameserver (Consigliato)
1. **Network Solutions** → Gestione Dominio → Cambia Nameserver
2. Imposta nameserver Hostinger:
   ```
   ns1.dns-parking.com
   ns2.dns-parking.com
   ```
3. **Hostinger** → hPanel → Domini → Aggiungi dominio esistente
4. Gestisci tutti i record DNS da Hostinger

### Opzione B: Solo Record A (Più semplice)
1. **Network Solutions** → DNS Management
2. Modifica record A di `shen3d.com`:
   ```
   Type: A
   Name: @
   Value: [IP del tuo VPS Hostinger]
   TTL: 3600
   ```
3. Aggiungi record A per `www`:
   ```
   Type: A
   Name: www
   Value: [IP del tuo VPS Hostinger]
   TTL: 3600
   ```

> **Nota**: Propagazione DNS richiede 24-48 ore, ma solitamente 1-2 ore.

---

## STEP 1: Setup VPS Hostinger

### 1.1 Acquisto VPS
1. Vai su https://www.hostinger.com/vps-hosting
2. Seleziona **VPS 1** (1 vCPU, 4GB RAM, 50GB SSD) - ~$6.99/mese
3. Scegli **Ubuntu 22.04 LTS** come sistema operativo
4. Completa l'acquisto
5. Riceverai email con:
   - IP del server (es: `185.XXX.XXX.XXX`)
   - Username: `root`
   - Password (o chiave SSH)

### 1.2 Primo Accesso SSH
```bash
# Windows (PowerShell o Git Bash)
ssh root@185.XXX.XXX.XXX

# Inserisci password fornita da Hostinger
```

### 1.3 Setup Iniziale Sicurezza
```bash
# Aggiorna sistema
apt update && apt upgrade -y

# Crea utente non-root (consigliato)
adduser shen3d
usermod -aG sudo shen3d

# Configura SSH (opzionale ma consigliato)
nano /etc/ssh/sshd_config
# Modifica: PermitRootLogin no
# Modifica: PasswordAuthentication no (se usi chiave SSH)
systemctl restart sshd

# Login come nuovo utente
su - shen3d
```

---

## STEP 2: Installare Stack Software

### 2.1 Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifica
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 2.2 PostgreSQL 15
```bash
# Installa PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Avvia servizio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verifica
sudo systemctl status postgresql
```

### 2.3 Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.4 PM2 (gestione processi Node.js)
```bash
sudo npm install -g pm2
```

### 2.5 Certbot (SSL Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## STEP 3: Configurare Database PostgreSQL

### 3.1 Creare Database e Utente
```bash
# Entra come utente postgres
sudo -u postgres psql

# Crea database
CREATE DATABASE dental_crm;

# Crea utente
CREATE USER dentaluser WITH ENCRYPTED PASSWORD 'password_sicura_complessa_123!';

# Concedi privilegi
GRANT ALL PRIVILEGES ON DATABASE dental_crm TO dentaluser;

# Esci
\q
```

### 3.2 Configurare Accesso Locale
```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Assicurati che ci sia:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
```

```bash
# Riavvia PostgreSQL
sudo systemctl restart postgresql
```

### 3.3 Test Connessione
```bash
psql -U dentaluser -d dental_crm -h localhost
# Inserisci password
# Dovresti vedere: dental_crm=>
\q
```

---

## STEP 4: Deploy Backend

### 4.1 Clonare Repository
```bash
# Crea directory
sudo mkdir -p /var/www/shen3d
sudo chown shen3d:shen3d /var/www/shen3d
cd /var/www/shen3d

# Clona repository (se usi GitHub)
git clone https://github.com/tuousername/dental-lab-crm.git .

# OPPURE carica via SCP dal tuo PC locale
# (su Windows PowerShell):
# scp -r dental-lab-crm/backend/* shen3d@185.XXX.XXX.XXX:/var/www/shen3d/backend/
```

### 4.2 Configurare Backend
```bash
cd /var/www/shen3d/backend

# Installa dipendenze
npm ci --only=production

# Genera Prisma client
npx prisma generate

# Crea file ambiente
nano .env
```

Contenuto `.env`:
```env
NODE_ENV=production
PORT=3000

# Database PostgreSQL
DATABASE_URL="postgresql://dentaluser:password_sicura_complessa_123!@localhost:5432/dental_crm"

# JWT
JWT_SECRET=il-tuo-jwt-secret-super-lungo-e-sicuro-minimo-64-caratteri-per-amore-del-cielo

# Google OAuth (da configurare dopo)
GOOGLE_CLIENT_ID=il-tuo-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=il-tuo-client-secret

# Frontend URL
FRONTEND_URL=https://shen3d.com

# CORS
CORS_ORIGINS=https://shen3d.com,https://www.shen3d.com

# File uploads
UPLOAD_PATH=./uploads
```

### 4.3 Eseguire Migrazioni Database
```bash
cd /var/www/shen3d/backend

# Applica migrazioni
npx prisma migrate deploy

# Popola database con dati iniziali
npx prisma db seed
```

### 4.4 Creare Directory Uploads
```bash
mkdir -p /var/www/shen3d/backend/uploads
chmod 755 /var/www/shen3d/backend/uploads
```

### 4.5 Build e Avvio con PM2
```bash
cd /var/www/shen3d/backend

# Build applicazione
npm run build

# Avvia con PM2
pm2 start dist/main.js --name "shen3d-backend"

# Salva configurazione PM2
pm2 save
pm2 startup systemd

# PM2 mostrerà un comando da eseguire con sudo, copialo ed eseguilo
# Esempio:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u shen3d --hp /home/shen3d
```

### 4.6 Verifica Backend
```bash
# Stato processo
pm2 status
pm2 logs shen3d-backend

# Test API
curl http://localhost:3000/api/health
```

---

## STEP 5: Deploy Frontend

### 5.1 Build Frontend (in locale o sul server)

**Opzione A: Build sul Server**
```bash
cd /var/www/shen3d/frontend

# Installa dipendenze
npm ci

# Crea .env.production
nano .env.production
```

Contenuto:
```env
VITE_API_URL=https://shen3d.com/api
VITE_DISABLE_AUTO_LOGIN=true
VITE_APP_NAME=Shen3D Dental Lab CRM
VITE_SUPPORT_EMAIL=support@shen3d.com
```

```bash
# Build
npm run build

# Copia build in directory nginx
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

**Opzione B: Build in locale e upload**
```bash
# Sul tuo PC Windows
cd dental-lab-crm/frontend
npm run build

# Upload via SCP
scp -r dist/* shen3d@185.XXX.XXX.XXX:/var/www/html/
```

---

## STEP 6: Configurare Nginx

### 6.1 Creare Configurazione Site
```bash
sudo nano /etc/nginx/sites-available/shen3d
```

Contenuto:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name shen3d.com www.shen3d.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name shen3d.com www.shen3d.com;

    # SSL (configurato da Certbot)
    ssl_certificate /etc/letsencrypt/live/shen3d.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shen3d.com/privkey.pem;

    # Frontend static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
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

        # Timeout per upload file grandi
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/shen3d/backend/uploads/;
        try_files $uri =404;

        # CORS per visualizzatore 3D
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 6.2 Abilitare Site
```bash
# Rimuovi default
sudo rm /etc/nginx/sites-enabled/default

# Abilita shen3d
sudo ln -s /etc/nginx/sites-available/shen3d /etc/nginx/sites-enabled/

# Test configurazione
sudo nginx -t

# Riavvia nginx
sudo systemctl restart nginx
```

---

## STEP 7: SSL con Let's Encrypt

```bash
# Richiedi certificato
sudo certbot --nginx -d shen3d.com -d www.shen3d.com

# Segui le istruzioni interattive

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## STEP 8: Configurare Google OAuth

### 8.1 Google Cloud Console
1. Vai su https://console.cloud.google.com/apis/credentials
2. Seleziona il progetto Shen3D
3. Modifica le credenziali OAuth esistenti
4. Aggiungi URI di redirect autorizzati:
   ```
   https://shen3d.com/api/auth/google/callback
   ```
5. Aggiungi origini JavaScript:
   ```
   https://shen3d.com
   ```

### 8.2 Aggiorna Variabili Backend
```bash
nano /var/www/shen3d/backend/.env
# Aggiorna GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET

# Riavvia backend
pm2 restart shen3d-backend
```

---

## STEP 9: Verifica Finale

### Test da eseguire:
```bash
# 1. Frontend raggiungibile
curl https://shen3d.com

# 2. Backend API raggiungibile
curl https://shen3d.com/api/health

# 3. Database connesso
pm2 logs shen3d-backend | grep -i "database\|prisma"

# 4. SSL funzionante
openssl s_client -connect shen3d.com:443 -servername shen3d.com
```

### Test Browser:
1. [ ] https://shen3d.com carica frontend
2. [ ] Login Google funziona
3. [ ] Upload file 3D funziona
4. [ ] Chat/WebSocket funziona
5. [ ] Visualizzatore 3D carica file

---

## STEP 10: Backup e Manutenzione

### 10.1 Script Backup Database
```bash
sudo nano /opt/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgres"
mkdir -p $BACKUP_DIR

pg_dump -U dentaluser dental_crm > "$BACKUP_DIR/dental_crm_$DATE.sql"

# Mantieni solo ultimi 7 giorni
find $BACKUP_DIR -name "dental_crm_*.sql" -mtime +7 -delete
```

```bash
chmod +x /opt/backup-db.sh

# Cron job giornaliero
sudo crontab -e
# Aggiungi:
0 2 * * * /opt/backup-db.sh
```

### 10.2 Backup File Uploads
```bash
sudo nano /opt/backup-files.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/var/backups/uploads"
mkdir -p $BACKUP_DIR

tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C /var/www/shen3d/backend uploads/

# Mantieni solo ultimi 7 giorni
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
```

---

## Comandi Utili

### Gestione PM2
```bash
pm2 status                 # Stato processi
pm2 logs shen3d-backend    # Log applicazione
pm2 restart shen3d-backend # Riavvio
pm2 stop shen3d-backend    # Stop
pm2 monit                  # Monitor real-time
```

### Gestione PostgreSQL
```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Accesso database
sudo -u postgres psql dental_crm
```

### Gestione Nginx
```bash
sudo nginx -t              # Test configurazione
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Aggiornamenti
```bash
# Aggiorna codice
cd /var/www/shen3d
git pull origin main

# Backend
cd backend
npm ci
npx prisma migrate deploy
npm run build
pm2 restart shen3d-backend

# Frontend
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/html/
```

---

## Troubleshooting

### Errore: "Cannot connect to database"
```bash
# Verifica PostgreSQL in ascolto
sudo netstat -plntu | grep 5432

# Verifica connessione
psql -U dentaluser -d dental_crm -h localhost

# Check log PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Errore: "502 Bad Gateway"
```bash
# Backend in esecuzione?
pm2 status

# Porta 3000 in ascolto?
sudo netstat -plntu | grep 3000

# Log backend
pm2 logs
```

### Errore CORS
```bash
# Verifica variabile CORS_ORIGINS
nano /var/www/shen3d/backend/.env

# Riavvia backend
pm2 restart shen3d-backend
```

### Spazio disco pieno
```bash
# Verifica spazio
df -h

# Pulizia log
sudo journalctl --vacuum-time=7d

# Pulizia pacchetti
sudo apt autoremove
sudo apt autoclean
```

---

## Costi Mensili Totali

| Servizio | Costo |
|----------|-------|
| Hostinger VPS 1 | ~$6.99/mese |
| Dominio (Network Solutions) | ~$15/anno (~$1.25/mese) |
| **TOTALE** | **~$8.24/mese** |

---

## Prossimi Passi

1. [ ] Acquista VPS su Hostinger
2. [ ] Punta dominio al VPS (record A o nameserver)
3. [ ] Segui STEP 1-10 di questa guida
4. [ ] Configura Google OAuth con nuovi URL
5. [ ] Test completo funzionalità
6. [ ] Cancella hosting Network Solutions

Hai bisogno di aiuto con qualche passo specifico?
