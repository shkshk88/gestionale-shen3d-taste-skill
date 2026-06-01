import i18n from '@/i18n/config';

const LOCALE_MAP: Record<string, string> = {
  it: 'it-IT',
  en: 'en-US',
  fr: 'fr-FR',
  he: 'he-IL',
};

/**
 * Returns the BCP-47 locale string matching the current i18next language.
 * Use this with toLocaleDateString/toLocaleTimeString instead of hardcoded 'it-IT'.
 */
export function getDateLocale(): string {
  return LOCALE_MAP[i18n.language] || 'it-IT';
}

/**
 * Returns a localized "X time ago" string (es: "6m fa" / "6m ago" / "6m היה").
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  const lang = i18n.language || 'it';

  const units = [
    { v: 60, s: { it: 's fa', en: 's ago', fr: 's', he: ' שניות' } },
    { v: 3600, s: { it: 'm fa', en: 'm ago', fr: 'min', he: ' דק׳' } },
    { v: 86400, s: { it: 'h fa', en: 'h ago', fr: 'h', he: ' שע׳' } },
    { v: 604800, s: { it: 'g fa', en: 'd ago', fr: 'j', he: ' ימים' } },
    { v: 2592000, s: { it: 'sett. fa', en: 'w ago', fr: 'sem', he: ' שב׳' } },
    { v: Infinity, s: { it: 'mesi fa', en: 'mo ago', fr: 'mois', he: ' חוד׳' } },
  ];

  let prev = 1;
  for (const u of units) {
    if (diff < u.v) {
      const n = Math.max(1, Math.floor(diff / prev));
      return `${n}${(u.s as any)[lang] || u.s.it}`;
    }
    prev = u.v;
  }
  return `${Math.floor(diff / 2592000)}${units[5].s.it}`;
}
