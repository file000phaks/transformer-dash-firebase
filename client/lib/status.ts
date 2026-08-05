import { sensorSchema, localToFirebaseMap } from "@/lib/sensors";

export type StatusLevel = "normal" | "warning" | "critical" | "offline";

/**
 * Data older than this is treated as stale/offline rather than trusted as a live reading.
 * `useSensors.ts` reads `ts` directly from the live Firebase subscription now (see
 * "Multi-Transformer Platform Restructure" in Questions.md) — no client-side shifting.
 * Re-verified 2026-08-04 against the live database: the newest `loriotData` record was
 * ~47s old, well inside this threshold.
 */
export const STALE_MS = 24 * 60 * 60 * 1000;

export function isStale(ts: number | null | undefined): boolean {
  if (!ts) return true;
  return Date.now() - ts > STALE_MS;
}

type MetricSchema = {
  kind: "number" | "boolean";
  normal?: [number, number];
  min?: number;
  max?: number;
};

/**
 * door/PIR/etc. arrive from Firebase as numeric `0 | 1` (see `shared/api.ts`'s
 * `SensorData` type), never native JS `true`/`false` — code that checked
 * `typeof value === "boolean"` was therefore never true for a real reading,
 * which is why these tiles always showed "—" regardless of whether the real
 * value was 0 or 1 (see "Boolean Field Bug Fix" in Questions.md). This coerces
 * either representation to a real boolean, treating only `undefined`/`null` as
 * "no value" — not falsiness, so a real `0`/`false` reading still coerces
 * correctly rather than being mistaken for "missing".
 */
export function coerceBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (value === 0) return false;
  if (value === 1) return true;
  return undefined;
}

/**
 * Three-tier threshold logic, derived from the ranges already defined in lib/sensors.ts:
 * - inside `normal` [lo, hi]              -> normal   (green)
 * - outside `normal` but inside [min,max] -> warning  (amber)  — approaching the sensor's rated limit
 * - outside [min, max]                    -> critical (red)    — at/beyond the sensor's physical limit
 * - boolean sensors (door/PIR/etc.)       -> critical when triggered/true, normal when clear/false
 */
export function metricStatus(
  value: number | boolean | undefined | null,
  schema: MetricSchema | undefined,
): StatusLevel {
  if (!schema) return "offline";

  if (schema.kind === "boolean") {
    const bool = coerceBoolean(value);
    if (bool === undefined) return "offline";
    return bool ? "critical" : "normal";
  }

  if (typeof value !== "number" || Number.isNaN(value) || !schema.normal) {
    return "offline";
  }

  const [lo, hi] = schema.normal;
  const min = schema.min ?? lo;
  const max = schema.max ?? hi;

  if (value >= lo && value <= hi) return "normal";
  if (value >= min && value <= max) return "warning";
  return "critical";
}

export function worstStatus(statuses: StatusLevel[]): StatusLevel {
  if (statuses.length === 0) return "offline";
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  if (statuses.includes("offline")) return "offline";
  return "normal";
}

/**
 * Rolls a full decoded sensor packet (Firebase-keyed) up into a single status,
 * checking staleness first — a stale packet is shown as "offline" regardless of
 * what the last readings happened to be, rather than presented as confidently normal/critical.
 */
export function computePacketStatus(
  decoded: Record<string, unknown> | null | undefined,
  ts: number | null | undefined,
): StatusLevel {
  if (isStale(ts) || !decoded) return "offline";

  const statuses = sensorSchema.map((m) => {
    const fbKey = (localToFirebaseMap as Record<string, string>)[m.key];
    return metricStatus(decoded[fbKey] as number | boolean | undefined, m as MetricSchema);
  });

  return worstStatus(statuses);
}

export const STATUS_META: Record<
  StatusLevel,
  { label: string; dot: string; text: string; bg: string; ring: string }
> = {
  normal: {
    label: "Normal",
    dot: "bg-status-normal",
    text: "text-status-normal",
    bg: "bg-status-normal/10",
    ring: "ring-status-normal/30",
  },
  warning: {
    label: "Warning",
    dot: "bg-status-warning",
    text: "text-status-warning",
    bg: "bg-status-warning/10",
    ring: "ring-status-warning/30",
  },
  critical: {
    label: "Critical",
    dot: "bg-status-critical",
    text: "text-status-critical",
    bg: "bg-status-critical/10",
    ring: "ring-status-critical/30",
  },
  offline: {
    label: "Stale",
    dot: "bg-status-offline",
    text: "text-status-offline",
    bg: "bg-status-offline/10",
    ring: "ring-status-offline/30",
  },
};

/** CSS custom property name per status level, for contexts that need a raw color (e.g. SVG/canvas). */
export const STATUS_VAR: Record<StatusLevel, string> = {
  normal: "--status-normal",
  warning: "--status-warning",
  critical: "--status-critical",
  offline: "--status-offline",
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Per-metric contribution to the health score, in [0, 1].
 * - Inside `normal` -> 1 (full marks).
 * - Between `normal` and the sensor's `min`/`max` -> scales linearly down to 0
 *   as the value approaches the physical limit, so a near-boundary "warning"
 *   reading barely dents the score while one right at the limit costs almost
 *   a full point — a proportional deduction rather than a flat warning/critical cut.
 * - At/beyond `min`/`max` -> 0.
 * - Boolean sensors (door/PIR) -> 1 when clear, 0 when triggered.
 */
/**
 * Returns `null` (not 0) when a reading has no usable value for this metric —
 * roughly 1-2% of real `loriotData` records are missing individual `decoded`
 * fields (confirmed live, see Questions.md "Firebase Schema Hardening").
 * `computeHealthScore` excludes `null`s from its average instead of scoring
 * a merely-absent field as a full critical failure.
 */
function metricContribution(
  value: number | boolean | undefined | null,
  schema: MetricSchema | undefined,
): number | null {
  if (!schema) return null;

  if (schema.kind === "boolean") {
    const bool = coerceBoolean(value);
    if (bool === undefined) return null;
    return bool ? 0 : 1;
  }

  if (typeof value !== "number" || Number.isNaN(value) || !schema.normal) return null;

  const [lo, hi] = schema.normal;
  const min = schema.min ?? lo;
  const max = schema.max ?? hi;

  if (value >= lo && value <= hi) return 1;

  if (value < lo) {
    const band = lo - min || 1;
    return clamp01((value - min) / band);
  }

  const band = max - hi || 1;
  return clamp01((max - value) / band);
}

/**
 * Overall system health score (0-100), averaged across every live metric in
 * `sensorSchema` weighted equally, each scored per `metricContribution`.
 */
export function computeHealthScore(
  decoded: Record<string, unknown> | null | undefined,
): number {
  if (!decoded) return 0;

  const contributions = sensorSchema
    .map((m) => {
      const fbKey = (localToFirebaseMap as Record<string, string>)[m.key];
      return metricContribution(decoded[fbKey] as number | boolean | undefined, m as MetricSchema);
    })
    .filter((c): c is number => c !== null);

  if (contributions.length === 0) return 0;

  const total = contributions.reduce((sum, c) => sum + c, 0);
  return Math.round((total / contributions.length) * 100);
}

export function healthScoreStatus(score: number): StatusLevel {
  if (score >= 90) return "normal";
  if (score >= 70) return "warning";
  return "critical";
}

/**
 * Physical plausibility bounds, independent of the operating-range thresholds in
 * `sensorSchema` — a reading outside these is a sensor fault (bad packet/wiring
 * glitch, e.g. the real ~6669 cabinetTemp spike seen in production) rather than a
 * real extreme value. Keyed by Firebase field name. Single source of truth shared
 * by `SensorTrends.tsx`'s chart fault-marking and `MetricsGrid.tsx`'s tile anomaly
 * indicator, so the two can't drift apart on what counts as "implausible".
 */
export const PLAUSIBILITY_BOUNDS: Partial<Record<string, { min?: number; max?: number }>> = {
  cabinetTemp: { min: -40, max: 150 },
  transf_temperature: { min: -40, max: 150 },
};

export function isImplausibleReading(value: unknown, fbKey: string): boolean {
  const bounds = PLAUSIBILITY_BOUNDS[fbKey];
  if (!bounds || typeof value !== "number" || Number.isNaN(value)) return false;

  return (bounds.min !== undefined && value < bounds.min) || (bounds.max !== undefined && value > bounds.max);
}
