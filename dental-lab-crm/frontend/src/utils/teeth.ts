// FDI anatomical sequences (right→left across the midline) used to collapse a
// set of selected teeth into compact "from–to" ranges for display.
const UPPER_SEQ = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_SEQ = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

/**
 * Collapse selected tooth numbers into compact ranges, e.g. [11,12,13,14,21] → "11–14, 21".
 * Contiguity follows anatomical position within each arch (crossing the midline is allowed,
 * so 13–23 is a valid canine-to-canine range). Upper and lower arches never merge.
 */
export function summarizeToothRanges(numbers: number[]): string {
  if (!numbers.length) return '';

  const withIdx = numbers
    .map((n) => {
      const inUpper = UPPER_SEQ.includes(n);
      const seq = inUpper ? UPPER_SEQ : LOWER_SEQ;
      return { n, arch: inUpper ? 0 : 1, idx: seq.indexOf(n) };
    })
    .filter((x) => x.idx !== -1)
    .sort((a, b) => a.arch - b.arch || a.idx - b.idx);

  if (!withIdx.length) return numbers.join(', ');

  const parts: string[] = [];
  let runStart = withIdx[0];
  let prev = withIdx[0];

  const closeRun = () => {
    if (runStart.n === prev.n) parts.push(`${runStart.n}`);
    else if (prev.idx - runStart.idx === 1) parts.push(`${runStart.n}, ${prev.n}`);
    else parts.push(`${runStart.n}–${prev.n}`);
  };

  for (let i = 1; i <= withIdx.length; i++) {
    const cur = withIdx[i];
    const contiguous = cur && cur.arch === prev.arch && cur.idx === prev.idx + 1;
    if (!contiguous) {
      closeRun();
      if (cur) runStart = cur;
    }
    if (cur) prev = cur;
  }

  return parts.join(', ');
}
