#!/usr/bin/env node

/**
 * Script di verifica rapida per i fix applicati
 * Esegui con: node verify-fix.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFICA FIX - Dental Lab CRM v3.0\n');

let errors = 0;
let warnings = 0;
let success = 0;

// Helper functions
function checkFile(filepath, description) {
  const fullPath = path.join(__dirname, filepath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    success++;
    return true;
  } else {
    console.log(`❌ ${description} - FILE NON TROVATO`);
    errors++;
    return false;
  }
}

function checkContentInFile(filepath, searchString, description) {
  const fullPath = path.join(__dirname, filepath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${description} - FILE NON TROVATO`);
    errors++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    console.log(`✅ ${description}`);
    success++;
    return true;
  } else {
    console.log(`⚠️  ${description} - CONTENUTO NON TROVATO`);
    warnings++;
    return false;
  }
}

console.log('📁 VERIFICA FILE MODIFICATI\n');

// Check modified files exist
checkFile('frontend/src/pages/client/NewCase.tsx', 'NewCase.tsx esiste');
checkFile('frontend/src/store/authStore.ts', 'authStore.ts esiste');
checkFile('frontend/src/hooks/useNotifications.ts', 'useNotifications.ts esiste');
checkFile('frontend/src/hooks/useChat.ts', 'useChat.ts esiste');

console.log('\n📄 VERIFICA NUOVI FILE CREATI\n');

// Check new files
checkFile('frontend/clear-browser-cache.html', 'clear-browser-cache.html creato');
checkFile('../TESTING_INSTRUCTIONS.md', 'TESTING_INSTRUCTIONS.md creato');
checkFile('../TECHNICAL_CHANGELOG_2026-01-28.md', 'TECHNICAL_CHANGELOG.md creato');
checkFile('../FIX_SUMMARY.md', 'FIX_SUMMARY.md creato');

console.log('\n🔧 VERIFICA MODIFICHE SPECIFICHE\n');

// Check specific changes
checkContentInFile(
  'frontend/src/pages/client/NewCase.tsx',
  'const fileInputRef = useRef<HTMLInputElement>(null)',
  'NewCase: fileInputRef aggiunto'
);

checkContentInFile(
  'frontend/src/pages/client/NewCase.tsx',
  'const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>)',
  'NewCase: handleFileSelect implementato'
);

checkContentInFile(
  'frontend/src/pages/client/NewCase.tsx',
  'const clientId = user?.client?.id || user?.clientId',
  'NewCase: fallback clientId implementato'
);

checkContentInFile(
  'frontend/src/pages/client/NewCase.tsx',
  'api.uploadFiles',
  'NewCase: upload files integrato'
);

checkContentInFile(
  'frontend/src/store/authStore.ts',
  "const STORAGE_VERSION = '3.0'",
  'authStore: versione 3.0'
);

checkContentInFile(
  'frontend/src/hooks/useNotifications.ts',
  'const SOCKET_URL = import.meta.env.VITE_API_URL?.replace',
  'useNotifications: SOCKET_URL separato'
);

checkContentInFile(
  'frontend/src/hooks/useNotifications.ts',
  'const API_BASE_URL = import.meta.env.VITE_API_URL',
  'useNotifications: API_BASE_URL aggiunto'
);

checkContentInFile(
  'frontend/src/hooks/useChat.ts',
  'const SOCKET_URL = import.meta.env.VITE_API_URL?.replace',
  'useChat: SOCKET_URL separato'
);

checkContentInFile(
  'frontend/src/hooks/useChat.ts',
  'const API_BASE_URL = import.meta.env.VITE_API_URL',
  'useChat: API_BASE_URL aggiunto'
);

console.log('\n📊 RIEPILOGO\n');
console.log(`✅ Successi: ${success}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`❌ Errori: ${errors}`);

console.log('\n');

if (errors === 0 && warnings === 0) {
  console.log('🎉 TUTTI I FIX SONO STATI APPLICATI CORRETTAMENTE!\n');
  console.log('Prossimi step:');
  console.log('1. Pulisci cache browser: http://localhost:5173/clear-browser-cache.html');
  console.log('2. Avvia backend: cd backend && npm run start:dev');
  console.log('3. Avvia frontend: cd frontend && npm run dev');
  console.log('4. Testa portale: http://localhost:5173/portal\n');
  process.exit(0);
} else if (errors === 0 && warnings > 0) {
  console.log('⚠️  FIX APPLICATI MA CON ALCUNI WARNING\n');
  console.log('Verifica manualmente i contenuti segnalati.\n');
  console.log('Se i file esistono ma i contenuti sono leggermente diversi,');
  console.log('potrebbe essere normale (formattazione, import order, etc.)\n');
  process.exit(0);
} else {
  console.log('❌ ALCUNI FIX NON SONO STATI APPLICATI CORRETTAMENTE\n');
  console.log('Controlla i file segnati con ❌ e applica le modifiche manualmente.\n');
  console.log('Consulta TECHNICAL_CHANGELOG_2026-01-28.md per i dettagli.\n');
  process.exit(1);
}
