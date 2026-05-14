# SOLUZIONE RAPIDA - Cancellare Cache Browser

## 🔧 PROBLEMA
Il browser ha ancora i vecchi dati dell'utente in cache (localStorage) che non includono il cliente corretto.

## ✅ SOLUZIONE IMMEDIATA

### Opzione 1: Console Browser (PIÙ VELOCE)

1. **Apri la Console del Browser**:
   - Windows: `F12` o `Ctrl+Shift+I`
   - Mac: `Cmd+Option+I`

2. **Vai alla tab "Console"**

3. **Copia e incolla questo comando e premi INVIO**:

```javascript
localStorage.clear(); window.location.reload();
```

Questo cancellerà tutti i dati salvati e ricaricherà la pagina.

---

### Opzione 2: DevTools Application

1. Apri DevTools (`F12`)
2. Vai alla tab **"Application"** (o "Applicazione")
3. Nel menu laterale sinistro, espandi **"Local Storage"**
4. Click su `http://localhost:5173`
5. Click destro → **"Clear"**
6. Ricarica la pagina (`F5`)

---

### Opzione 3: Modalità Incognito

1. Apri una finestra **Incognito/Private**:
   - Windows: `Ctrl+Shift+N` (Chrome) o `Ctrl+Shift+P` (Firefox)
   - Mac: `Cmd+Shift+N`
2. Vai a `http://localhost:5173/portal`

---

## 🎯 DOPO LA PULIZIA

Una volta cancellato il localStorage, il portale clienti dovrebbe:

✅ Caricare automaticamente l'utente "Clinica Dentale Rossi"
✅ Avere il cliente associato con ID corretto
✅ Permettere la creazione di nuovi casi
✅ Permettere l'upload di file

---

## 🧪 COME VERIFICARE CHE FUNZIONI

Dopo aver cancellato il localStorage:

1. **Vai al portale clienti**: `http://localhost:5173/portal`

2. **Apri la console** (F12) e digita:

```javascript
JSON.parse(localStorage.getItem('auth-storage'))
```

3. **Dovresti vedere**:
```json
{
  "state": {
    "user": {
      "id": "dev-client-user",
      "clientId": "34e85227-82d5-45dc-9926-2ea72c0bb18f",
      "client": {
        "id": "34e85227-82d5-45dc-9926-2ea72c0bb18f",
        "studioName": "Clinica Dentale Rossi",
        ...
      }
    }
  }
}
```

Se vedi il `clientId` e l'oggetto `client` completo, è tutto OK! ✅

---

## 📝 SE CONTINUA A NON FUNZIONARE

Se dopo aver cancellato il localStorage continua a dare "Cliente non trovato":

1. **Controlla la console del browser** per errori
2. **Controlla la tab Network** (F12 → Network) e verifica:
   - La richiesta a `/api/cases` (POST)
   - Guarda il payload inviato
   - Verifica se c'è il `clientId`

3. **Fai uno screenshot** dell'errore e mostralo

---

**Data**: 28 Gennaio 2026
**Soluzione**: Cancellare localStorage e forzare ricaricamento dati utente
