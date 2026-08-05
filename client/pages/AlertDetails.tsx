import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNotifications } from "@/state/notifications";
import Map from "@/components/site/Map";
import { Button } from "@/components/ui/button";
import StatusPill from "@/components/site/StatusPill";
import { StatusLevel } from "@/lib/status";
import { formatTimestamp } from "@/lib/time";

const SEVERITY_STATUS: Record<"warn" | "crit", StatusLevel> = {
  warn: "warning",
  crit: "critical",
};

export default function AlertDetails() {

  const { id } = useParams();

  const { alerts } = useNotifications();

  const alert = alerts.find( ( a ) => a.id === id );

  if ( !alert ) {
    return (
      <main className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-muted-foreground">Alert not found.</p>
        <Link to="/alerts" className="mt-3 inline-block text-primary underline">
          Back to Alerts
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl">

      <Link to="/alerts" className="inline-block">
        <Button variant="outline" size="sm" className="mb-4 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{alert.label}</h1>
            <StatusPill status={SEVERITY_STATUS[ alert.severity ]} />
          </div>
          {alert.message && (
            <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">

        <div className="lg:col-span-2">

          {typeof alert.lat === "number" && typeof alert.lng === "number" && (
            <div className="h-64 overflow-hidden rounded-xl border">
              <Map
                center={{ lat: alert.lat, lng: alert.lng }}
                markers={[ { id: alert.id, lat: alert.lat, lng: alert.lng } ]}
                className="h-64"
              />
            </div>
          )}

        </div>

        <aside className="rounded-xl border bg-card p-5">

          <p className="text-sm font-semibold">Details</p>

          <dl className="mt-3 grid gap-2 text-sm">

            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Transformer</dt>
              <dd>
                {alert.transformerName ? (
                  <Link to={`/transformers/${alert.transformerId}`} className="text-primary hover:underline">
                    {alert.transformerName}
                  </Link>
                ) : "Unknown"}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Time</dt>
              <dd className="font-mono">{formatTimestamp( alert.ts )}</dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Metric</dt>
              <dd className="font-mono">{alert.key}</dd>
            </div>

            {typeof alert.value !== "undefined" && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Value</dt>
                <dd className="font-mono">{String( alert.value )}</dd>
              </div>
            )}

            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Alert ID</dt>
              <dd className="font-mono text-xs text-muted-foreground">{alert.id}</dd>
            </div>

          </dl>

        </aside>

      </div>

    </main>
  );
}
