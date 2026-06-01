import { readFileSync } from 'fs'
import { resolve } from 'path'

const dir = 'src/i18n/locales'
const source = JSON.parse(readFileSync(resolve(dir, 'it.json'), 'utf8'))
const targets = ['en', 'fr', 'he']

function findMissing(src, tgt, path = '') {
  const missing = {}
  for (const [k, v] of Object.entries(src)) {
    const fullPath = path ? `${path}.${k}` : k
    if (typeof v === 'object' && v !== null) {
      const sub = findMissing(v, tgt?.[k] ?? {}, fullPath)
      if (Object.keys(sub).length > 0) missing[k] = sub
    } else if (!(k in (tgt ?? {}))) {
      missing[k] = v
    }
  }
  return missing
}

for (const lang of targets) {
  const tgt = JSON.parse(readFileSync(resolve(dir, `${lang}.json`), 'utf8'))
  const missing = findMissing(source, tgt)
  const count = JSON.stringify(missing).split(':').length - 1
  if (count > 0) {
    console.log(`\n=== MISSING ${lang.toUpperCase()} (${count} keys) ===`)
    console.log(JSON.stringify(missing, null, 2))
  } else {
    console.log(`✅ ${lang.toUpperCase()}: nessuna chiave mancante`)
  }
}
