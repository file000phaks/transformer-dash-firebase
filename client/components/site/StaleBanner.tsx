import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { isStale } from "@/lib/status";
import { formatRelativeTime, formatTimestamp } from "@/lib/time";

/** Full-width notice for the top of a page when the underlying reading is stale. */
export function StaleDataBanner({ ts, className }: { ts: number | null | undefined; className?: string }) {
  if (!isStale(ts)) return null;

  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex items-start gap-3 rounded-xl border border-status-offline/30 bg-status-offline/10 px-4 py-3 text-sm",
        className,
      )}
    >
      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-status-offline" />
      <div>
        <p className="font-medium text-foreground">Showing historical data — not live</p>
        <p className="mt-0.5 text-muted-foreground">
          Last reading received{" "}
          <span className="font-mono">{formatRelativeTime(ts)}</span>
          {ts ? <> ({formatTimestamp(ts)})</> : null}. The Loriot → Firebase ingestion pipeline
          may not be running.
        </p>
      </div>
    </div>
  );
}

/** Compact inline chip for use next to any other timestamp in the UI. */
export function StaleBadge({ ts, className }: { ts: number | null | undefined; className?: string }) {
  if (!isStale(ts)) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-status-offline/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-status-offline ring-1 ring-inset ring-status-offline/30",
        className,
      )}
    >
      <Clock className="h-2.5 w-2.5" />
      Stale
    </span>
  );
}
