"""
Test per la pagina NewCase (upload caso)
Verifica errori nella console, struttura DOM e funzionalità base
"""
from playwright.sync_api import sync_playwright
import sys

def test_newcase_page():
    console_errors = []
    console_warnings = []
    network_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        # Cattura errori console
        page.on("console", lambda msg: {
            console_errors.append(msg.text) if msg.type == "error" else
            console_warnings.append(msg.text) if msg.type == "warning" else None
        })

        # Cattura errori network
        page.on("response", lambda response: {
            network_errors.append({
                'url': response.url,
                'status': response.status,
                'status_text': response.status_text
            }) if response.status >= 400 else None
        })

        print("=" * 60)
        print("TEST PAGINA NEW CASE - PORTALE CLIENTI")
        print("=" * 60)

        # 1. Naviga alla pagina di login
        print("\n[1/6] Navigazione a /login...")
        page.goto('http://localhost:5173/login')
        page.wait_for_load_state('networkidle')
        print(f"   Status: Pagina login caricata")

        # 2. Effettua login come cliente (se necessario)
        # In dev mode, controlla se c'è un form di login o se siamo già autenticati
        current_url = page.url
        if '/login' in current_url:
            print("   Rilevata pagina di login, verifica presenza form...")
            # Attendi che il form sia visibile
            try:
                page.wait_for_selector('input, button', timeout=3000)
                print("   Form login trovato")
            except:
                print("   ATTENZIONE: Nessun form trovato sulla pagina login")

        # 3. Naviga alla pagina NewCase
        print("\n[2/6] Navigazione a /portal/new-case...")
        page.goto('http://localhost:5173/portal/new-case')
        page.wait_for_load_state('networkidle')
        print(f"   URL attuale: {page.url}")

        # 4. Verifica struttura della pagina
        print("\n[3/6] Analisi struttura pagina...")

        # Cerca elementi chiave
        selectors_to_check = [
            ('h1', 'Titolo pagina'),
            ('input[type="text"]', 'Input testo (nome paziente)'),
            ('input[type="file"]', 'Input file upload'),
            ('button', 'Bottoni'),
            ('[class*="card"]', 'Card/container'),
            ('[class*="tooth"], [class*="Tooth"]', 'Schema dentale FDI'),
        ]

        for selector, description in selectors_to_check:
            try:
                elements = page.locator(selector).all()
                print(f"   {description}: {len(elements)} trovati")
            except Exception as e:
                print(f"   {description}: ERRORE - {e}")

        # 5. Screenshot per ispezione visuale
        print("\n[4/6] Cattura screenshot...")
        screenshot_path = '/tmp/newcase_screenshot.png'
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"   Screenshot salvato in: {screenshot_path}")

        # 6. Verifica errori React ( se ci sono)
        print("\n[5/6] Verifica errori React...")
        react_errors = []
        try:
            # Cerca error boundary o messaggi di errore React
            error_elements = page.locator('text=/error|Error|ERRORE/i').all()
            if error_elements:
                print(f"   ATTENZIONE: Trovati {len(error_elements)} possibili errori visualizzati")
                for el in error_elements[:3]:
                    text = el.text_content()
                    if text:
                        print(f"   - {text[:100]}")
            else:
                print("   Nessun errore visibile rilevato")
        except Exception as e:
            print(f"   Errore durante verifica: {e}")

        # 7. Controlla se ci sono problemi con file upload specificamente
        print("\n[6/6] Verifica componente upload file...")
        try:
            # Cerca l'input file nascosto
            file_input = page.locator('input[type="file"]').first
            if file_input.count() > 0:
                print("   Input file trovato")
                # Verifica attributi
                accept = file_input.get_attribute('accept')
                multiple = file_input.get_attribute('multiple')
                print(f"   - accept: {accept}")
                print(f"   - multiple: {multiple}")
            else:
                print("   ATTENZIONE: Input file NON trovato!")

            # Cerca la drop zone
            drop_zone = page.locator('text=/drag|drop|trascina|carica/i').first
            if drop_zone.count() > 0:
                print("   Drop zone trovata")
            else:
                print("   Drop zone NON trovata")
        except Exception as e:
            print(f"   Errore: {e}")

        browser.close()

    # Riepilogo errori
    print("\n" + "=" * 60)
    print("RIEPILOGO ERRORI")
    print("=" * 60)

    if console_errors:
        print(f"\n Errori Console ({len(console_errors)}):")
        for err in console_errors[:10]:
            print(f"   - {err[:150]}")
    else:
        print("\n Nessun errore console rilevato")

    if console_warnings:
        print(f"\n Warnings Console ({len(console_warnings)}):")
        for warn in console_warnings[:5]:
            print(f"   - {warn[:150]}")

    if network_errors:
        print(f"\n Errori Network ({len(network_errors)}):")
        for err in network_errors[:10]:
            print(f"   - {err['status']} {err['status_text']}: {err['url'][:80]}")

    # Esito finale
    print("\n" + "=" * 60)
    if console_errors or network_errors:
        print("ESITO: FALLITO - Errori rilevati")
        sys.exit(1)
    else:
        print("ESITO: OK - Nessun errore critico rilevato")
        sys.exit(0)

if __name__ == "__main__":
    test_newcase_page()
