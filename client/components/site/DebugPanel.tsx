import { Fragment, useEffect, useState } from "react";
import { Bug, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { localToFirebaseMap } from "@/lib/sensors";
import type { LastKnownGood } from "@/hooks/useSensors";

const METRIC_FB_KEYS = Object.values(localToFirebaseMap);

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/50">{label}</span>
      <span className="text-white/90">{value}</span>
    </div>
  );
}

/**
 * On-page diagnostic overlay for the live Firebase data pipeline. Every value here is
 * a prop passed straight through from the same useSensors() instance that drives the
 * rest of the dashboard (health score, stat tiles, trend charts) — not a second call
 * to the hook and not an independent recomputation. If the `onValue` subscription
 * ever stalls, `tickCount`/`lastTickAt` freeze here in lockstep with the rest of
 * the page, which is itself the diagnostic signal this panel exists to surface.
 */
export default function DebugPanel({
  totalRecords,
  tickCount,
  lastTickAt,
  bufferSize,
  currentDecoded,
  lastKnownGood,
  className,
}: {
  totalRecords: number;
  tickCount: number;
  lastTickAt: number | null;
  bufferSize: number;
  currentDecoded: Record<string, unknown> | null;
  lastKnownGood: LastKnownGood;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [, forceRerender] = useState(0);

  // Purely a UI refresh clock for the "seconds since last tick" readout below —
  // it doesn't read or compute any sensor data itself, only forces this component
  // to re-render every second so Date.now() - lastTickAt stays current between the
  // real 5s emits.
  useEffect(() => {
    const id = setInterval(() => forceRerender((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open debug panel"
        className={cn(
          "fixed bottom-3 right-3 z-50 grid h-9 w-9 place-items-center rounded-full bg-black/80 text-white shadow-lg hover:bg-black/90",
          className,
        )}
      >
        <Bug className="h-4 w-4" />
      </button>
    );
  }

  const secondsSinceTick = lastTickAt ? Math.max(0, Math.floor((Date.now() - lastTickAt) / 1000)) : null;

  return (
    <div
      className={cn(
        "fixed bottom-3 right-3 z-50 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-white/10 bg-black/80 text-white shadow-xl backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
          <Bug className="h-3.5 w-3.5" />
          Debug: live Firebase stream
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand debug panel" : "Collapse debug panel"}
            className="rounded p-1 hover:bg-white/10"
          >
            {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Dismiss debug panel"
            className="rounded p-1 hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="max-h-80 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
          <Row label="Buffer loaded (initial)" value={totalRecords} />
          <Row label="Live updates received" value={tickCount} />
          <Row label="Last update" value={lastTickAt ? new Date(lastTickAt).toLocaleTimeString() : "—"} />
          <Row label="Since last update" value={secondsSinceTick !== null ? `${secondsSinceTick}s` : "—"} />
          <Row label="Buffer size" value={bufferSize} />

          <div className="mt-2 border-t border-white/10 pt-2">
            <p className="mb-1 text-white/50">Per-field: present in current raw record / ticks since last value</p>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5">
              <span className="text-white/40">field</span>
              <span className="text-white/40">present?</span>
              <span className="text-right text-white/40">ticks stale</span>
              {METRIC_FB_KEYS.map((key) => {
                const present = currentDecoded ? currentDecoded[key] !== undefined : false;
                const entry = lastKnownGood[key];
                const ticksStale = entry ? tickCount - entry.updatedAtTick : null;
                return (
                  <Fragment key={key}>
                    <span className="truncate text-white/80">{key}</span>
                    <span className={present ? "text-status-normal" : "text-status-critical"}>
                      {present ? "yes" : "no"}
                    </span>
                    <span className="text-right text-white/80">{ticksStale === null ? "never" : ticksStale}</span>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="mt-2 border-t border-white/10 pt-2">
            <p className="mb-1 text-white/50">Current decoded (raw, unfiltered):</p>
            <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all text-white/90">
              {currentDecoded ? JSON.stringify(currentDecoded, null, 1) : "null"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
