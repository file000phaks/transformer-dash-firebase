import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSensors } from "@/hooks/useSensors";
import MetricsGrid from "@/components/site/MetricsGrid";
import HealthScore from "@/components/site/HealthScore";
import SensorTrends from "@/components/site/SensorTrends";
import Map from "@/components/site/Map";
import { useNotifications } from "@/state/notifications";
import { computeHealthScore } from "@/lib/status";
import { generateWeeklyReport } from "@/lib/pdfReport";
import { formatShortAge } from "@/lib/time";

const TRANSFORMER_NAME = "NUST Model Transformer Unit";
const TRANSFORMER_COORDS = { lat: -20.1645216, lng: 28.6409461 };
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Forces a re-render every `intervalMs` so time-relative text (e.g. "synced Xs ago") stays live. */
function useTicker(intervalMs = 1000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function LivePill({ ts }: { ts: number | undefined }) {
  useTicker(1000);

  const label = ts ? formatShortAge(ts) : "connecting…";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-normal/10 px-2.5 py-1 text-xs font-medium text-status-normal ring-1 ring-inset ring-status-normal/30">
      <span className="h-1.5 w-1.5 rounded-full bg-status-normal" aria-hidden />
      Live · synced <span className="font-mono">{label}</span>
    </span>
  );
}

export default function Dashboard() {
  const {
    sensorSchema,
    sensorData,
    effectiveSensorData,
    lastKnownGood,
    latestPacket,
    history,
  } = useSensors();
  const { addAlert } = useNotifications();

  const lastSynced = latestPacket?.ts as number | undefined;
  // Health score, stat tiles, and the PDF report's current-score line all read from
  // the carried-forward last-known-good values, not the raw current record — a
  // record that's routinely missing a field shouldn't score that metric as a
  // failure (see "Last-Known-Good Value Handling" in Questions.md).
  const healthScore = computeHealthScore(effectiveSensorData);

  const handleAlert = (opts: {
    key: string;
    label: string;
    value: number | boolean;
    severity: "warn" | "crit";
  }) => {
    addAlert({
      key: opts.key,
      label: opts.label,
      value: opts.value,
      severity: opts.severity,
      transformerName: TRANSFORMER_NAME,
      lat: TRANSFORMER_COORDS.lat,
      lng: TRANSFORMER_COORDS.lng,
    });
  };

  return (
    <main className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{TRANSFORMER_NAME}</h1>
          <LivePill ts={lastSynced} />
        </div>

        <Button className="gap-2" onClick={() => generateWeeklyReport(history, TRANSFORMER_NAME, healthScore)}>
          <Download className="h-4 w-4" />
          Generate weekly report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr]">
        <HealthScore score={healthScore} className="h-full" />

        {sensorData ? (
          <MetricsGrid
            schema={sensorSchema}
            metrics={effectiveSensorData}
            freshness={lastKnownGood}
            onAlert={handleAlert}
          />
        ) : (
          <div className="grid place-items-center rounded-xl border bg-card p-8 text-sm text-muted-foreground">
            Loading live sensor data...
          </div>
        )}
      </div>

      <SensorTrends
        fields={["transf_temperature", "cabinetHumidity"]}
        windowMs={ONE_WEEK_MS}
        lineColor="teal"
      />

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Location</h2>
        <div className="mt-3 h-80 overflow-hidden rounded-xl border">
          <Map
            center={TRANSFORMER_COORDS}
            zoom={16}
            markers={[{ id: "nust", ...TRANSFORMER_COORDS, label: TRANSFORMER_NAME }]}
            className="h-80"
          />
        </div>
      </section>
    </main>
  );
}
