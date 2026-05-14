# 🎨 Shen3D "Ethereal Glass" Design System
*Proposta di Design V2 - Ispirata ai Reference "Soft Bento"*

Osservando i riferimenti forniti (`esempio 1` e `esempio 2`), l'obiettivo si sposta da un semplice "tema beige" a un'interfaccia **"Ethereal Glass"** basata su **Bento Grids**, **Soft Gradients** e un **Glassmorphism** estremamente raffinato.

Ecco la nuova direzione estetica e tecnica:

## 1. � Atmosfera & Sfondi (The "Mesh" Vibe)
Il design attuale è troppo "piatto". I riferimenti mostrano sfondi vivi e profondi.

-   **Background Dinamico**: Non più un colore solido (`bg-surface`).
    -   **Mesh Gradients**: Utilizzare sfere di colore sfocate (blu etereo, beige sabbia, verde menta desaturato) che si fondono nello sfondo (`fixed inset-0 -z-10`).
    -   **Esempio CSS**:
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

## 2. 🍱 Layout "Bento Box"
I riferimenti usano prepotentemente griglie modulari dove ogni card ha il suo spazio definito ma armonico.

-   **Struttura**: Dashboard organizzata a blocchi rettangolari/quadrati perfetti.
-   **Rounded Corners Estremi**: Passare da `rounded-xl` a **`rounded-[2rem]` (32px)** per le card principali, come nei riferimenti. Questo crea un look molto "amichevole" e moderno.
-   **Spacing**: Aumentare il gap tra le card (`gap-6` o `gap-8`) per far "respirare" il design.

## 3.  🪟 Advanced Glassmorphism
Le card dei riferimenti non sono semplici rettangoli bianchi.

-   **Layering**:
    -   **Base Layer**: Bianco con opacità 60-80% + Backdrop Blur intenso (`backdrop-blur-xl`).
    -   **Border**: Bordo sottilissimo bianco/trasparente (`border border-white/40`) per definire la forma senza appesantire.
    -   **Inner Shadow**: Una leggerissima ombra interna bianca (`inset-0`) per dare "volume" al vetro.
-   **Card Colorate**: Come nell'esempio 1 (card blu, gialla, nera), alcune tessere del bento grid devono essere **piene e vibranti** per creare contrasto visivo e gerarchia.
    -   *Esempio*: La card "Nuovo Caso" potrebbe essere un blocco solido `bg-black text-white` o `bg-brand-primary text-white` per spiccare nel mare di vetro.

## 4. � Navigazione "Floating"
Abbandonare la sidebar fissa a tutta altezza.

-   **Floating Sidebar**: Una "pillola" verticale stondata sospesa a sinistra dello schermo, non attaccata ai bordi.
    -   Icone minimal (senza testo) con stato attivo evidenziato da un cerchio morbido o un rettangolo stondato.
-   **Pill Tabs**: Navigazione superiore (es. in Dettaglio Caso) fatta a "pillole" (sfondo scuro per attivo, trasparente per inattivo), esattamente come nel riferimento "Salesforce".

## 5. 💎 Dettagli "Preziosi"

-   **Tipografia**: Titoli grandi, neri e bold (Inter Tight o simile) su sfondo chiaro. Label piccole in grigio medio.
-   **Icone**: Icone "duotone" o con sfondi circolari morbidi.
-   **Chart Minimal**: Grafici a barre dai colori pastello ma saturi (verde acido, blu elettrico) su sfondo bianco/vetro.

## 🧱 Componenti da Ristrutturare (Action Plan)

### A. La Nuova `GlassCard`
```tsx
// Esempio concettuale
<div className="
  rounded-[2rem]
  bg-white/70       // Base semitrasparente
  backdrop-blur-xl  // Blur effetto vetro
  border border-white/50 // Bordo luminoso
  shadow-[0_8px_30px_rgb(0,0,0,0.04)] // Ombra soffice diffusa
  p-6
">
  {children}
</div>
```

### B. La `VibrantCard` (per Call-to-Actions)
```tsx
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

### C. Transizioni
- Implementare transizioni **layout** con Framer Motion: quando si apre una sezione, le card dovrebbero "espandersi" dalla posizione originale (layout animation).

## Prossimi Passi Operativi

1.  **Installazione Dipendenze**: Assicurarsi di avere `clsx` e `tailwind-merge` per gestire queste classi complesse.
2.  **Refactor `index.css`**: Inserire le classi utility per `bg-mesh` e i nuovi gradienti.
3.  **Layout Update**: Modificare il componente `Layout` principale per supportare la floating sidebar e lo sfondo dinamico.

Questa direzione trasformerà il gestionale da "funzionale" a "esperienza visiva immersiva".
