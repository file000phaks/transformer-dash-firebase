import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "@/state/notifications";
import { Button } from "@/components/ui/button";
import StatusPill from "@/components/site/StatusPill";
import { StatusLevel } from "@/lib/status";
import { formatRelativeTime, formatTimestamp } from "@/lib/time";

const SEVERITY_STATUS: Record<"warn" | "crit", StatusLevel> = {
  warn: "warning",
  crit: "critical",
};

export default function AlertsPage() {

  const { alerts, clearAlert, clearAll } = useNotifications();
  const navigate = useNavigate();

  return (

    <main className="mx-auto max-w-7xl">

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Threshold breaches and sensor events across the fleet.
          </p>
        </div>

        {alerts.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}

      </div>

      {alerts.length === 0 ? (

        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No alerts yet.
        </div>

      ) : (

        <ul className="divide-y overflow-hidden rounded-xl border bg-card">

          {alerts.map( ( a ) => (

            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >

              <div className="min-w-0">

                <button
                  className="font-medium text-primary hover:underline"
                  onClick={() => navigate( `/alerts/${a.id}` )}
                >
                  {a.label}
                </button>

                <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">

                  {a.transformerName ? (
                    <>
                      <Link
                        to={`/transformers/${a.transformerId}`}
                        className="hover:underline"
                      >
                        {a.transformerName}
                      </Link>
                      <span>•</span>
                    </>
                  ) : null}

                  <span className="font-mono" title={formatTimestamp( a.ts )}>
                    {formatRelativeTime( a.ts )}
                  </span>

                </p>

              </div>

              <div className="flex shrink-0 items-center gap-3">

                <StatusPill status={SEVERITY_STATUS[ a.severity ]} size="sm" />

                <button
                  onClick={() => clearAlert( a.id )}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Dismiss
                </button>

              </div>

            </li>

          ) )}
        </ul>
      )}

    </main>

  );

}
