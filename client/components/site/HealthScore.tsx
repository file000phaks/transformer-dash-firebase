import { cn } from "@/lib/utils";
import { healthScoreStatus, STATUS_META } from "@/lib/status";
import { sensorSchema } from "@/lib/sensors";

export default function HealthScore({ score, className }: { score: number; className?: string }) {
  const status = healthScoreStatus(score);
  const meta = STATUS_META[status];

  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - score / 100);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">System Health</p>

      <div className="relative grid h-32 w-32 place-items-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset] duration-700", meta.text)}
            stroke="currentColor"
          />
        </svg>
        <span className="font-mono text-4xl font-bold leading-none tracking-tight tabular-nums">{score}</span>
      </div>

      <p className={cn("text-sm font-semibold", meta.text)}>{meta.label}</p>
      <p className="text-xs text-muted-foreground">
        Based on {sensorSchema.length} live metrics, weighted equally
      </p>
    </div>
  );
}
