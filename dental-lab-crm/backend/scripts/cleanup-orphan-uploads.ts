/**
 * Cleanup orphan files in uploads/ directory.
 *
 * Listed as M-04 in AUDIT_2026-05-16.md.
 *
 * Confronta i file fisici in `uploads/` con i record `CaseFile.filePath` nel DB.
 * I file non referenziati vengono spostati in `uploads/_orphans/<timestamp>/`
 * (mai cancellati direttamente, per sicurezza).
 *
 * Esecuzione:
 *   npx ts-node scripts/cleanup-orphan-uploads.ts
 *   npx ts-node scripts/cleanup-orphan-uploads.ts --dry-run    (solo report, non sposta)
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const uploadsDir = path.resolve(__dirname, '..', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    console.log('Cartella uploads/ non esiste, niente da fare.');
    return;
  }

  // Struttura attesa: uploads/<caseId>/<fileUuid>.<ext>
  // 1. Sottocartelle (eccetto _orphans)
  const physicalDirs = fs
    .readdirSync(uploadsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_orphans')
    .map((d) => d.name);

  // 2. Tutti i CaseFile nel DB con basename del path
  const dbFiles = await prisma.caseFile.findMany({
    select: { filePath: true, fileName: true, caseId: true },
  });
  const referencedDirs = new Set(dbFiles.map((f) => f.caseId));
  const referencedBasenames = new Set(
    dbFiles.map((f) => path.basename(f.filePath))
  );

  // Una sottocartella è orfana se: nessun CaseFile la referenzia (caseId non corrisponde)
  const orphanDirs = physicalDirs.filter((d) => !referencedDirs.has(d));

  let orphanSize = 0;
  let orphanFileCount = 0;
  for (const dir of orphanDirs) {
    const full = path.join(uploadsDir, dir);
    const inner = fs.readdirSync(full, { withFileTypes: true }).filter((d) => d.isFile());
    orphanFileCount += inner.length;
    for (const f of inner) {
      orphanSize += fs.statSync(path.join(full, f.name)).size;
    }
  }

  console.log(`📁 Sottocartelle in uploads/:    ${physicalDirs.length}`);
  console.log(`🔗 CaseFile nel DB:              ${dbFiles.length}`);
  console.log(`👻 Sottocartelle orfane:         ${orphanDirs.length}`);
  console.log(`👻 File orfani (totale):         ${orphanFileCount}`);
  console.log(`💾 Spazio occupato orfani:       ${(orphanSize / 1024).toFixed(1)} KB`);

  // Sanity: ci sono basename referenziati che non trovo fisicamente?
  if (referencedBasenames.size > 0) {
    let missing = 0;
    for (const f of dbFiles) {
      if (!fs.existsSync(path.resolve(uploadsDir, '..', f.filePath))) missing++;
    }
    if (missing > 0) console.log(`⚠️  File referenziati nel DB ma mancanti su disco: ${missing}`);
  }

  if (orphanDirs.length === 0) {
    console.log('✅ Nessuna sottocartella orfana. Tutto pulito.');
    return;
  }

  if (dryRun) {
    console.log('\n--dry-run attivo, niente spostato. Prime 10 sottocartelle orfane:');
    orphanDirs.slice(0, 10).forEach((d) => console.log('  -', d));
    return;
  }

  // 3. Sposta in _orphans/<timestamp>/ (mai cancellare)
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveDir = path.join(uploadsDir, '_orphans', ts);
  fs.mkdirSync(archiveDir, { recursive: true });

  for (const d of orphanDirs) {
    fs.renameSync(path.join(uploadsDir, d), path.join(archiveDir, d));
  }

  console.log(`\n✅ ${orphanDirs.length} sottocartelle orfane spostate in: ${archiveDir}`);
  console.log('   Verifica e cancella manualmente quando sei sicuro.');
}

main()
  .catch((e) => {
    console.error('Errore:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
