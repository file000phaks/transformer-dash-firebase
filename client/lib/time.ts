const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
  ["second", 1000],
];

export function formatRelativeTime(ts: number | null | undefined): string {
  if (!ts) return "unknown";

  const diff = ts - Date.now();
  const abs = Math.abs(diff);

  for (const [unit, ms] of UNITS) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }

  return "just now";
}

export function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return "—";

  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Compact "Xs ago" / "Xm ago" form — the same short style already used by the
 * homepage's "Live · synced Xs ago" pill, reused for per-field freshness
 * captions on stat tiles so both read as one consistent live-dashboard idiom
 * rather than a mix of a short pill and a verbose per-tile label.
 */
export function formatShortAge(ts: number | null | undefined): string {
  if (!ts) return "—";

  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
