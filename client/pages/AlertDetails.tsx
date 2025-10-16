import { useParams, Link } from "react-router-dom";
import { useNotifications } from "@/state/notifications";
import Map from "@/components/site/Map";
import { Button } from "@/components/ui/button";

export default function AlertDetails() {
 
  const { id } = useParams();
 
  const { alerts } = useNotifications();
 
  const alert = alerts.find((a) => a.id === id);

  if (!alert) {
    return (
      <main className="container mx-auto py-8">
        <p className="text-sm text-muted-foreground">Alert not found.</p>
        <Link to="/alerts" className="mt-3 inline-block text-primary underline">
          Back to Alerts
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto grid gap-6 py-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{alert.label}</h1>
          <Link to="/alerts">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        {alert.message && (
          <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
        )}
        <div className="mt-4 rounded-xl border bg-card p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Transformer:</span>{" "}
            {alert.transformerName ?? "Unknown"}
          </p>
          <p className="mt-1">
            <span className="text-muted-foreground">Time:</span>{" "}
            {new Date(alert.ts).toLocaleString()}
          </p>
          <p className="mt-1">
            <span className="text-muted-foreground">Severity:</span>{" "}
            {alert.severity}
          </p>
        </div>
        {typeof alert.lat === "number" && typeof alert.lng === "number" && (
          <div className="mt-4 h-64 overflow-hidden rounded-xl border">
            <Map
              center={{ lat: alert.lat!, lng: alert.lng! }}
              markers={[{ id: alert.id, lat: alert.lat!, lng: alert.lng! }]}
              className="h-64"
            />
          </div>
        )}
      </div>
      <aside className="grid gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Details</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Alert ID: {alert.id}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Metric: {alert.key}
          </p>
          {typeof alert.value !== "undefined" && (
            <p className="mt-1 text-sm text-muted-foreground">
              Value: {String(alert.value)}
            </p>
          )}
        </div>
      </aside>
    </main>
  );
}
