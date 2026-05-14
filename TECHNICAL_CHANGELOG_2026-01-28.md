# 🔧 CHANGELOG TECNICO - Dental Lab CRM

**Data**: 2026-01-28
**Versione**: 3.0
**Focus**: Fix Upload File + Creazione Casi + API Endpoints

---

## 📋 RIEPILOGO MODIFICHE

### File Modificati: 5
1. `frontend/src/pages/client/NewCase.tsx`
2. `frontend/src/store/authStore.ts`
3. `frontend/src/hooks/useNotifications.ts`
4. `frontend/src/hooks/useChat.ts`
5. `frontend/src/pages/client/CaseDetail.tsx` (già modificato in precedenza)

### File Creati: 2
1. `frontend/clear-browser-cache.html`
2. `TESTING_INSTRUCTIONS.md`

---

## 🐛 PROBLEMI RISOLTI

### 1. Upload File NON Funzionante in NewCase

**Problema**:
```tsx
// PRIMA - Pulsante dummy senza funzionalità
<button className="...">
  Seleziona file
</button>
```

**Soluzione**:
```tsx
// DOPO - Input file nascosto + handler completi
const fileInputRef = useRef<HTMLInputElement>(null);
const [files, setFiles] = useState<File[]>([]); // Era: { name: string; size: string }[]

<input
  ref={fileInputRef}
  type="file"
  multiple
  accept=".jpg,.jpeg,.png,.heic,.webp,.stl,.ply"
  onChange={handleFileSelect}
  className="hidden"
/>

const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = event.target.files;
  if (selectedFiles && selectedFiles.length > 0) {
    setFiles(Array.from(selectedFiles));
  }
};
```

**Funzionalità aggiunte**:
- Handler `handleFileSelect` per catturare file selezionati
- Handler `handleRemoveFile` per rimuovere file dalla lista
- Funzione `formatFileSize` per mostrare dimensioni leggibili
- Upload effettivo dopo creazione caso con `api.uploadFiles()`

---

### 2. Creazione Caso Fallisce - "Cliente non trovato"

**Problema**:
```tsx
// PRIMA - Validazione fragile
if (!user?.client?.id) {
  toast({ title: 'Errore', description: 'Cliente non trovato' });
  return;
}

const caseData = {
  clientId: user.client.id, // Potrebbe essere undefined
  ...
};
```

**Soluzione**:
```tsx
// DOPO - Fallback robusto + validazione migliorata
const clientId = user?.client?.id || user?.clientId;

if (!clientId) {
  console.error('User data:', user); // Debug log
  toast({
    title: 'Errore di configurazione',
    description: 'Cliente non associato all\'utente. Contatta il supporto.',
    variant: 'destructive',
  });
  return;
}

const caseData = {
  clientId: clientId, // Garantito non-null
  patientName: patientName.trim(), // Ora obbligatorio
  ...
};
```

**Validazioni aggiunte**:
- Check `patientName` obbligatorio
- Check `selectedTeeth.length > 0`
- Log dettagliati per debugging
- Upload file DOPO creazione caso (con ID valido)

---

### 3. Errori 404 con Doppio `/api/`

**Problema**:
```tsx
// useNotifications.ts - PRIMA
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// VITE_API_URL = 'http://localhost:3000/api'

const response = await fetch(`${API_URL}/notifications`, ...);
// URL finale: http://localhost:3000/api/notifications ❌ (corretto)
// Ma per WebSocket: http://localhost:3000/api (errato, serve senza /api)
```

**Soluzione**:
```tsx
// DOPO - Separazione SOCKET_URL e API_BASE_URL
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// WebSocket connection
const socket = io(SOCKET_URL, { ... }); // http://localhost:3000

// REST API calls
const response = await fetch(`${API_BASE_URL}/notifications`, ...); // http://localhost:3000/api/notifications
```

**File modificati**:
- `useNotifications.ts`: 5 occorrenze corrette
- `useChat.ts`: 4 occorrenze corrette

---

### 4. Cache Browser Obsoleta

**Problema**:
- localStorage conteneva `auth-storage` versione 2.0
- Struttura User object incompatibile con nuovi requisiti
- Hard reload browser non sufficiente

**Soluzione A - Auto-migration**:
```tsx
// authStore.ts - PRIMA
const STORAGE_VERSION = '2.0';

// DOPO
const STORAGE_VERSION = '3.0'; // Incrementato

if (currentVersion !== STORAGE_VERSION) {
  console.log('🔄 Upgrading auth storage v3.0, clearing old data...');
  localStorage.removeItem('auth-storage');
  localStorage.setItem('auth-storage-version', STORAGE_VERSION);
  useAuthStore.getState().logout();
}
```

**Soluzione B - Tool Manuale**:
```html
<!-- clear-browser-cache.html -->
<button onclick="clearAll()">Pulisci Tutto e Ricarica</button>

<script>
async function clearAll() {
  localStorage.clear();
  sessionStorage.clear();
  // Clear IndexedDB, cookies, Service Workers...
  window.location.href = '/portal';
}
</script>
```

---

## 📊 MODIFICHE DETTAGLIATE

### `NewCase.tsx`

**Import aggiunti**:
```tsx
import { useState, useRef } from 'react'; // Aggiunto useRef
import api from '../../services/api'; // Aggiunto per upload
```

**State modificati**:
```tsx
// PRIMA
const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

// DOPO
const [files, setFiles] = useState<File[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);
```

**Handler nuovi**:
```tsx
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => { ... }
const handleRemoveFile = (index: number) => { ... }
const formatFileSize = (bytes: number): string => { ... }
```

**handleSubmit - Modifiche**:
```diff
+ // Validazione patientName obbligatorio
+ if (!patientName.trim()) { ... }

+ // Validazione denti selezionati
+ if (selectedTeeth.length === 0) { ... }

+ // Fallback clientId
+ const clientId = user?.client?.id || user?.clientId;

+ // Log per debugging
+ console.log('Creating case with data:', caseData);

+ // Upload file DOPO creazione caso
+ if (files.length > 0) {
+   await api.uploadFiles(`/files/upload-multiple/${newCase.id}`, files);
+ }
```

**UI Step 3 - Modifiche**:
```tsx
// Input file nascosto (collegato a ref)
<input
  ref={fileInputRef}
  type="file"
  multiple
  accept=".jpg,.jpeg,.png,.heic,.webp,.stl,.ply"
  onChange={handleFileSelect}
  className="hidden"
/>

// Area clickable
<div onClick={() => fileInputRef.current?.click()} className="...">
  ...
</div>

// Lista file con dimensioni reali
{files.map((file, i) => (
  <div key={i} className="...">
    <p>{file.name}</p>
    <p>{formatFileSize(file.size)}</p> {/* Era: file.size */}
    <button onClick={() => handleRemoveFile(i)}>
      <X size={18} />
    </button>
  </div>
))}
```

---

### `authStore.ts`

```diff
- const STORAGE_VERSION = '2.0';
+ const STORAGE_VERSION = '3.0';

if (currentVersion !== STORAGE_VERSION) {
-   console.log('🔄 Upgrading auth storage, clearing old data...');
+   console.log('🔄 Upgrading auth storage v3.0, clearing old data...');
  localStorage.removeItem('auth-storage');
  localStorage.setItem('auth-storage-version', STORAGE_VERSION);
  useAuthStore.getState().logout();
}
```

---

### `useNotifications.ts`

```diff
- const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
+ const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
+ const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// WebSocket
- const socket = io(API_URL, { ... });
+ const socket = io(SOCKET_URL, { ... });

// API Calls (5 occorrenze)
- fetch(`${API_URL}/notifications`, ...)
+ fetch(`${API_BASE_URL}/notifications`, ...)

- fetch(`${API_URL}/notifications/${id}/read`, ...)
+ fetch(`${API_BASE_URL}/notifications/${id}/read`, ...)

- fetch(`${API_URL}/notifications/read-all`, ...)
+ fetch(`${API_BASE_URL}/notifications/read-all`, ...)
```

---

### `useChat.ts`

```diff
- const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
+ const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
+ const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// API Calls (4 occorrenze)
- fetch(`${SOCKET_URL}/cases/${caseId}/messages`, ...)
+ fetch(`${API_BASE_URL}/cases/${caseId}/messages`, ...)

- fetch(`${SOCKET_URL}/cases/${caseId}/messages`, { method: 'POST', ... })
+ fetch(`${API_BASE_URL}/cases/${caseId}/messages`, { method: 'POST', ... })

- fetch(`${SOCKET_URL}/cases/${caseId}/messages/mark-read`, ...)
+ fetch(`${API_BASE_URL}/cases/${caseId}/messages/mark-read`, ...)
```

---

## 🧪 TESTING

### Unit Tests da Aggiungere (TODO)

```typescript
// NewCase.test.tsx
describe('NewCase - File Upload', () => {
  it('should handle file selection', () => { ... });
  it('should format file size correctly', () => { ... });
  it('should remove file from list', () => { ... });
  it('should validate clientId before submission', () => { ... });
});

// useNotifications.test.ts
describe('useNotifications', () => {
  it('should use correct API_BASE_URL for REST calls', () => { ... });
  it('should use correct SOCKET_URL for WebSocket', () => { ... });
});

// useChat.test.ts
describe('useChat', () => {
  it('should fetch messages with correct endpoint', () => { ... });
  it('should send message with correct endpoint', () => { ... });
});
```

---

## 📈 METRICHE

### Linee di codice modificate
- `NewCase.tsx`: +120 linee (handler + validazione + upload)
- `authStore.ts`: 3 linee
- `useNotifications.ts`: 10 linee
- `useChat.ts`: 8 linee

### Breaking Changes
- ❌ Nessun breaking change
- ✅ Backward compatible (auto-migration localStorage)

### Performance
- Upload file: streaming con `multipart/form-data`
- Nessun impatto su rendering (useRef per input)

---

## 🔐 SICUREZZA

### Validazioni aggiunte
- File type whitelist: `.jpg,.jpeg,.png,.heic,.webp,.stl,.ply`
- File size limit: 20MB (già presente nel backend)
- ClientId validation prima di chiamare API
- PatientName obbligatorio (prevenire casi vuoti)

### XSS Protection
- File names sanitizzati automaticamente da browser
- No innerHTML usage

---

## 🚀 DEPLOYMENT

### Checklist Pre-Deploy
- [ ] Build frontend senza errori: `npm run build`
- [ ] TypeScript check: `npm run type-check`
- [ ] Lint pass: `npm run lint`
- [ ] Backend tests: `npm test` (backend)
- [ ] Seed database: `npm run seed` (se nuovo deploy)

### Environment Variables
```env
# Frontend (.env)
VITE_API_URL=http://localhost:3000/api

# Backend (.env)
DATABASE_URL=postgresql://...
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=20971520
```

---

## 📚 DOCUMENTAZIONE

### API Endpoints Modificati
Nessuna modifica API backend. Solo correzioni client-side.

### Type Definitions Aggiornati
Nessuna modifica ai tipi TypeScript.

---

## 🔮 PROSSIMI STEP

### Miglioramenti Suggeriti
1. **Drag & Drop**: Implementare handler `onDrop` per area upload
2. **Progress Bar**: Mostrare upload progress per file grandi
3. **Preview Images**: Thumbnail per immagini prima dell'upload
4. **File Validation**: Controllo magic bytes per validare tipo file reale
5. **Retry Logic**: Retry automatico se upload fallisce
6. **Compression**: Comprimere immagini prima dell'upload (client-side)

### Bug Noti
- Socket.io non connette (non implementato backend)
- Notifications endpoint ritorna 404 (non implementato backend)
- 3D viewer file PLY non caricano se non presenti in `/public/models/`

---

## 👥 CONTRIBUTORS

- **Claude Sonnet 4.5**: Analisi problema + implementazione fix
- **Roberto (rsciu)**: Testing + bug reporting

---

## 📞 SUPPORT

Per problemi:
1. Controllare `TESTING_INSTRUCTIONS.md`
2. Verificare DevTools Console
3. Controllare Network Tab per request fallite
4. Usare `clear-browser-cache.html` se problemi persistono

---

**Versione**: 3.0
**Status**: ✅ Pronto per testing
**Last Updated**: 2026-01-28
