# 🧪 ISTRUZIONI DI TEST - Dental Lab CRM

## Data: 2026-01-28
## Versione: 3.0

---

## 🎯 PROBLEMI RISOLTI

### 1. Upload File NON Funzionante
**Causa**: Il pulsante "Seleziona file" nello step 3 di NewCase era solo decorativo, senza handler
**Soluzione**:
- Aggiunto `<input type="file" ref={fileInputRef}>` nascosto
- Collegato pulsante e area drag&drop all'input file
- Implementati handler `handleFileSelect` e `handleRemoveFile`
- Aggiunto supporto per visualizzazione dimensione file formattata

### 2. Creazione Caso Fallisce con "Cliente non trovato"
**Causa**: Validazione errata che controllava `user?.client?.id` ma non considerava `user?.clientId`
**Soluzione**:
- Aggiunta logica fallback: `const clientId = user?.client?.id || user?.clientId`
- Aggiunti log dettagliati per debugging
- Migliorata validazione dei dati prima dell'invio
- Upload file ora avviene DOPO la creazione del caso con ID valido

### 3. Errori 404 con Doppio `/api/`
**Causa**: `useNotifications.ts` e `useChat.ts` usavano `SOCKET_URL` che già includeva `/api`
**Soluzione**:
- Separati `SOCKET_URL` (per WebSocket, senza /api) e `API_BASE_URL` (per REST, con /api)
- Aggiornati tutti gli endpoint fetch per usare la variabile corretta

### 4. Cache Browser Obsoleta
**Causa**: localStorage conteneva dati vecchi della versione precedente
**Soluzione**:
- Incrementata versione storage da 2.0 a 3.0 in authStore.ts
- Creato tool `clear-browser-cache.html` per pulizia manuale
- Auto-migration al caricamento dell'app in modalità DEV

---

## 🚀 PROCEDURA DI TEST COMPLETA

### STEP 0: Pulizia Cache (OBBLIGATORIO)

**Opzione A - Tool Automatico (Consigliato)**
1. Apri nel browser: `http://localhost:5173/clear-browser-cache.html`
2. Clicca "Pulisci Tutto e Ricarica"
3. Attendi il reload automatico

**Opzione B - Manuale**
1. Apri DevTools (F12)
2. Application → Storage → Clear site data
3. Seleziona tutto e clicca "Clear site data"
4. Ricarica la pagina (Ctrl+Shift+R)

**Opzione C - Console Browser**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### STEP 1: Avvio Backend

```bash
cd dental-lab-crm/backend
npm run start:dev
```

**Verifica**: Console deve mostrare:
```
[Nest] 12345  - 28/01/2026, 10:00:00     LOG [NestApplication] Nest application successfully started
```

### STEP 2: Avvio Frontend

```bash
cd dental-lab-crm/frontend
npm run dev
```

**Verifica**: Console deve mostrare:
```
  ➜  Local:   http://localhost:5173/
```

### STEP 3: Verifica Database

**Controllo Cliente Esistente**
```bash
cd dental-lab-crm/backend
npx prisma studio
```

Nella tabella `Client`, verifica che esista il record:
- **ID**: `34e85227-82d5-45dc-9926-2ea72c0bb18f`
- **studioName**: "Clinica Dentale Rossi"
- **email**: "info@clinicarossi.it"

Se NON esiste, esegui:
```bash
npm run seed
```

### STEP 4: Test Portale Clienti

#### 4.1 - Accesso Portale
1. Apri browser: `http://localhost:5173/portal`
2. DevTools Console deve mostrare:
   ```
   🔄 Upgrading auth storage v3.0, clearing old data...
   ```
3. Verifica che l'header mostri "Dr. Mario Rossi"

#### 4.2 - Verifica Dati Utente (DevTools)
Console → Digita:
```javascript
JSON.parse(localStorage.getItem('auth-storage')).state.user
```

Deve restituire oggetto con:
```json
{
  "id": "dev-client-user",
  "email": "info@clinicarossi.it",
  "role": "client",
  "clientId": "34e85227-82d5-45dc-9926-2ea72c0bb18f",
  "client": {
    "id": "34e85227-82d5-45dc-9926-2ea72c0bb18f",
    "studioName": "Clinica Dentale Rossi",
    ...
  }
}
```

#### 4.3 - Test Creazione Caso

1. Clicca "Invia Nuovo Caso"
2. **Step 1 - Dati Paziente**
   - Nome: `Giovanni Bianchi`
   - Note: `Paziente allergico al nichel`
   - Clicca "Avanti"

3. **Step 2 - Schema Dentale**
   - Seleziona tipo lavorazione: "Corona Zirconia" (blu)
   - Clicca sui denti: 11, 12, 21, 22
   - Verifica che appaiano colorati in blu
   - Clicca "Avanti"

4. **Step 3 - Upload File** ⭐ TEST CRITICO
   - Clicca "Seleziona file" o area drag&drop
   - Seleziona 2-3 file (JPG/PNG/STL)
   - **VERIFICA**: File devono apparire nella lista sotto
   - **VERIFICA**: Dimensione file deve essere mostrata (es. "2.5 MB")
   - Testa rimozione: clicca X su un file
   - **VERIFICA**: File viene rimosso dalla lista
   - Clicca "Avanti"

5. **Step 4 - Consegna**
   - Data consegna: seleziona data futura (+7 giorni)
   - Priorità: "Normale"
   - Note: `Preferenza colore A2`
   - Clicca "Avanti"

6. **Step 5 - Riepilogo**
   - **VERIFICA DATI**:
     - Paziente: Giovanni Bianchi
     - Denti: 4 denti selezionati
     - File: N file (numero corretto)
     - Data consegna: data corretta
   - Clicca "Invia Caso"

7. **Verifica Successo**
   - Toast verde: "Caso LAB-2025-XXXX inviato con successo"
   - Redirect automatico a `/portal/cases`

#### 4.4 - Verifica Caso Creato

1. In `/portal/cases`, trova il caso appena creato
2. Clicca sul caso per aprire il dettaglio
3. **Tab Files** ⭐ TEST CRITICO
   - Verifica che i file caricati siano visibili
   - Clicca "Carica file" per aggiungerne altri
   - Testa download di un file

4. **Tab Chat**
   - Invia un messaggio di test
   - Verifica che appaia nella chat

5. **Tab 3D Viewer**
   - Se hai caricato file STL/PLY, verifica che si visualizzi

#### 4.5 - Test Upload File su Caso Esistente

1. Apri un caso dalla lista `/portal/cases`
2. Tab "File" → clicca "Carica file"
3. Seleziona 1-2 file
4. **VERIFICA**: Toast "File caricati con successo"
5. **VERIFICA**: File appaiono nella lista

---

## 🔍 COSA VERIFICARE IN DEVTOOLS

### Console Errors da Ignorare
Questi errori sono NORMALI in modalità dev:
- `404 /api/notifications` - endpoint non implementato
- `WebSocket connection failed` - Socket.io non configurato
- `Failed to load resource: 404 models/` - file 3D demo mancanti

### Errori da NON Ignorare
Questi errori indicano problemi:
- ❌ `Cliente non trovato` → verifica database cliente
- ❌ `user?.client?.id is undefined` → verifica authStore
- ❌ `Cannot read property 'id' of undefined` → problema user object
- ❌ `404 /api/api/cases` → doppio /api (dovrebbe essere risolto)

### Network Tab - Verifica Request
Quando crei un caso, verifica:

**POST /api/cases**
- Status: `201 Created`
- Request Body deve includere:
  ```json
  {
    "clientId": "34e85227-82d5-45dc-9926-2ea72c0bb18f",
    "patientName": "Giovanni Bianchi",
    "teeth": [...],
    "dueDate": "2026-02-04T...",
    "priority": "normal"
  }
  ```

**POST /api/files/upload-multiple/{caseId}**
- Status: `201 Created`
- Content-Type: `multipart/form-data`
- Response: Array di file objects

---

## 📊 CHECKLIST FINALE

### ✅ Funzionalità da Testare

- [ ] Pulizia cache completata
- [ ] Backend avviato senza errori
- [ ] Frontend avviato senza errori
- [ ] Cliente presente in database
- [ ] Accesso portale clienti OK
- [ ] User object contiene `client` e `clientId`
- [ ] **Upload file nello Step 3 funziona**
- [ ] File appaiono nella lista con dimensione
- [ ] Rimozione file dalla lista funziona
- [ ] **Creazione caso completa senza errori**
- [ ] Toast di successo appare
- [ ] Caso visibile in `/portal/cases`
- [ ] **File caricati visibili nel dettaglio caso**
- [ ] Upload file su caso esistente funziona
- [ ] Download file funziona
- [ ] Chat invia messaggi correttamente
- [ ] NO errori 404 con `/api/api/`

---

## 🐛 TROUBLESHOOTING

### Problema: "Cliente non trovato"
**Causa**: Database non contiene cliente con ID corretto
**Soluzione**:
```bash
cd dental-lab-crm/backend
npm run seed
# Riavvia backend
npm run start:dev
```

### Problema: Upload file non fa nulla
**Causa**: Cache browser vecchia
**Soluzione**:
1. Apri `/clear-browser-cache.html`
2. Pulisci tutto
3. Hard reload (Ctrl+Shift+R)

### Problema: Errore 404 `/api/api/notifications`
**Causa**: Versione vecchia del codice
**Soluzione**:
```bash
cd dental-lab-crm/frontend
# Ferma il dev server (Ctrl+C)
npm run dev
```

### Problema: File non appaiono dopo upload
**Causa**: Endpoint `/api/files/case/:id` non risponde
**Verifica**:
1. DevTools → Network → cerca request `/api/files/case/...`
2. Status deve essere 200
3. Se 404/500, controlla backend logs

### Problema: authStore.user è null
**Soluzione**:
```javascript
// In DevTools Console
localStorage.removeItem('auth-storage');
localStorage.removeItem('auth-storage-version');
location.reload();
```

---

## 📝 LOG ESEMPIO SUCCESSO

Console quando tutto funziona:

```
🔄 Upgrading auth storage v3.0, clearing old data...
Creating case with data: {clientId: "34e85227-...", patientName: "Giovanni Bianchi", ...}
Case created: {id: "abc123", caseNumber: "LAB-2025-0003", ...}
Uploading 2 files...
Files uploaded successfully
```

Network Tab:
```
POST /api/cases                           201 Created
POST /api/files/upload-multiple/abc123   201 Created
GET /api/files/case/abc123                200 OK
```

---

## ✉️ SEGNALAZIONE BUG

Se trovi errori, fornisci:

1. **Screenshot** dell'errore in console
2. **Network Tab** → Copy as cURL della request fallita
3. **localStorage** → `auth-storage` content
4. **Backend logs** dal terminale
5. **Steps to reproduce** - cosa hai fatto prima dell'errore

---

## 🎉 TEST SUPERATO?

Se tutti i checkpoint sono ✅:
- Upload file funziona
- Creazione caso completa con successo
- File visibili nel dettaglio caso
- NO errori critici in console

**CONGRATULAZIONI! Il portale clienti è funzionante** 🚀

---

**Versione documento**: 3.0
**Ultima modifica**: 2026-01-28
**Autore**: Claude Sonnet 4.5
