import { cn } from "@/lib/utils";
import { STATUS_META, StatusLevel } from "@/lib/status";

export default function StatusPill({
  status,
  size = "default",
  className,
}: {
  status: StatusLevel;
  size?: "sm" | "default";
  className?: string;
}) {
  const meta = STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        meta.bg,
        meta.text,
        meta.ring,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}
