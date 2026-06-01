import { useMemo } from 'react';

interface ClientAvatarProps {
  studioName: string;
  logoUrl?: string | null;
  size?: number;
  /** Tailwind classes for fallback background (when no logo). Defaults to slate. */
  fallbackBg?: string;
  /** Tailwind classes for rounded corners. Default: rounded-xl */
  rounded?: string;
  className?: string;
}

/**
 * Avatar/logo del cliente. Mostra il logo caricato se presente, altrimenti
 * le iniziali del nome studio su sfondo colorato deterministico.
 */
export function ClientAvatar({
  studioName,
  logoUrl,
  size = 40,
  fallbackBg,
  rounded = 'rounded-xl',
  className = '',
}: ClientAvatarProps) {
  const initials = useMemo(() => {
    if (!studioName) return '?';
    return studioName
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [studioName]);

  // Deterministic background color from name when caller doesn't specify one
  const autoBg = useMemo(() => {
    if (fallbackBg) return fallbackBg;
    const palette = [
      'bg-sky-500',
      'bg-teal-500',
      'bg-slate-700',
      'bg-slate-500',
      'bg-sky-700',
    ];
    let hash = 0;
    for (let i = 0; i < studioName.length; i++) {
      hash = (hash << 5) - hash + studioName.charCodeAt(i);
      hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
  }, [studioName, fallbackBg]);

  const dim = { width: size, height: size };
  const fontSize = Math.max(10, Math.floor(size * 0.36));

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={studioName}
        style={dim}
        className={`${rounded} object-cover shrink-0 bg-slate-100 ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      style={dim}
      className={`${rounded} ${autoBg} flex items-center justify-center text-white font-bold shrink-0 ${className}`}
    >
      <span style={{ fontSize }}>{initials}</span>
    </div>
  );
}
