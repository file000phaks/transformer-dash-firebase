import { useEffect, useState } from "react";
import {
  Download,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Wrench,
  Activity,
  Radio,
  Wifi,
  MapPin,
  Cpu,
  Building,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
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
import { Transformer } from "@/types/transformer";
import { cn } from "@/lib/utils";

const DEFAULT_TRANSFORMER_NAME = "NUST Model Transformer Unit";
const DEFAULT_COORDS = { lat: -20.1645216, lng: 28.6409461 };
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Forces a re-render every `intervalMs` so time-relative text (e.g. "synced Xs ago") stays live. */
function useTicker( intervalMs = 1000 ) {
  const [ , setTick ] = useState( 0 );

  useEffect( () => {
    const id = setInterval( () => setTick( ( t ) => t + 1 ), intervalMs );
    return () => clearInterval( id );
  }, [ intervalMs ] );
}

function LivePill( { ts }: { ts: number | undefined } ) {
  useTicker( 1000 );

  const label = ts ? formatShortAge( ts ) : "connecting…";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-normal/10 px-2.5 py-1 text-xs font-medium text-status-normal ring-1 ring-inset ring-status-normal/30">
      <span className="h-1.5 w-1.5 rounded-full bg-status-normal animate-pulse" aria-hidden />
      Live · synced <span className="font-mono">{label}</span>
    </span>
  );
}

export default function Dashboard( {
  transformer,
  onToggleArmed,
  onToggleMode,
}: {
  transformer?: Transformer;
  onToggleArmed?: ( currentArmed: boolean ) => void;
  onToggleMode?: ( currentMode: "normal" | "maintenance" ) => void;
} ) {
  const name = transformer?.name || DEFAULT_TRANSFORMER_NAME;
  const coords = transformer ? { lat: transformer.lat, lng: transformer.lng } : DEFAULT_COORDS;
  const eui = transformer?.eui || "wwwwwwwwwwwwwww";
  const city = transformer?.city || "Bulawayo";
  const suburb = transformer?.suburb || "NUST";
  const type = transformer?.type || "GMT";
  const isArmed = transformer?.armed ?? true;
  const mode = transformer?.mode ?? "normal";

  const {
    sensorSchema,
    sensorData,
    effectiveSensorData,
    lastKnownGood,
    latestPacket,
    history,
  } = useSensors( eui );
  const { addAlert } = useNotifications();

  const lastSynced = latestPacket?.ts as number | undefined;
  const healthScore = computeHealthScore( effectiveSensorData );

  const handleAlert = ( opts: {
    key: string;
    label: string;
    value: number | boolean;
    severity: "warn" | "crit";
  } ) => {
    // Suppress alerts if unit is in maintenance mode or disarmed for security sensors
    if ( mode === "maintenance" ) return;
    if ( !isArmed && ( opts.key === "door" || opts.key === "intruder" || opts.key === "vibration" ) ) return;

    addAlert( {
      key: opts.key,
      label: opts.label,
      value: opts.value,
      severity: opts.severity,
      transformerName: name,
      lat: coords.lat,
      lng: coords.lng,
    } );
  };

  // Format frequency to MHz if given in Hz
  const formatFreq = ( freq?: number ) => {
    if ( !freq ) return "868.1 MHz";
    if ( freq > 1000000 ) return `${( freq / 1000000 ).toFixed( 1 )} MHz`;
    return `${freq} MHz`;
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      {/* 1. TOP HEADER & METADATA BAR */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                {type}
              </span>
              <LivePill ts={lastSynced} />
            </div>

            {/* Transformer Location & EUI Metadata */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-muted-foreground/70" />
                {city}, {suburb}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                {coords.lat.toFixed( 4 )}, {coords.lng.toFixed( 4 )}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground/70" />
                EUI: <span className="font-semibold text-foreground/80">{eui}</span>
              </span>
            </div>
          </div>

          {/* Quick Actions (Report, Arm/Disarm, Mode) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Arm / Disarm Button */}
            {onToggleArmed && (
              <Button
                variant={isArmed ? "outline" : "destructive"}
                size="sm"
                className={cn(
                  "gap-1.5 transition-colors",
                  isArmed
                    ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    : "bg-red-600 text-white hover:bg-red-700"
                )}
                onClick={() => onToggleArmed( isArmed )}
                title={isArmed ? "Click to disarm perimeter" : "Click to arm perimeter"}
              >
                {isArmed ? (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Armed
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4" />
                    Disarmed
                  </>
                )}
              </Button>
            )}

            {/* Maintenance Mode Button */}
            {onToggleMode && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5 transition-colors",
                  mode === "maintenance"
                    ? "border-amber-400 bg-amber-50/50 text-amber-800 hover:bg-amber-100/60 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
                )}
                onClick={() => onToggleMode( mode )}
                title={mode === "maintenance" ? "Click to switch to Normal mode" : "Click to switch to Maintenance mode"}
              >
                <Wrench className="h-4 w-4" />
                {mode === "maintenance" ? "Maintenance" : "Normal Mode"}
              </Button>
            )}

            <Button
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => generateWeeklyReport( history, name, healthScore )}
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Informational Status Banners for Maintenance / Disarmed */}
        {mode === "maintenance" && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Maintenance Mode Active:</strong> Operational and security alerts are temporarily silenced for servicing.
            </span>
          </div>
        )}

        {!isArmed && mode !== "maintenance" && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-500/10 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-500/20">
            <ShieldAlert className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" />
            <span>
              <strong>Unit Disarmed:</strong> Physical perimeter motion, door, and vibration breach alarms are muted.
            </span>
          </div>
        )}

        {/* RF & Gateway Signal Telemetry Strip */}
        <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4 sm:grid-cols-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Device EUI</p>
              <p className="font-mono text-xs font-bold text-foreground truncate max-w-[140px]" title={latestPacket?.eui || eui}>
                {latestPacket?.eui || eui}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wifi className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">RSSI Signal</p>
              <p className="font-mono text-xs font-bold text-foreground">
                {latestPacket?.rssi !== undefined ? `${latestPacket.rssi} dBm` : "-82 dBm"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">SNR Ratio</p>
              <p className="font-mono text-xs font-bold text-foreground">
                {latestPacket?.snr !== undefined ? `${latestPacket.snr} dB` : "+9.2 dB"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">RF Frequency</p>
              <p className="font-mono text-xs font-bold text-foreground">
                {formatFreq( latestPacket?.freq )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HEALTH SCORE & METRICS GRID */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr]">
        <HealthScore score={healthScore} className="h-full" />

        {sensorData ? (
          <MetricsGrid
            schema={sensorSchema}
            metrics={effectiveSensorData}
            freshness={lastKnownGood}
            onAlert={handleAlert}
            armed={isArmed}
            mode={mode}
          />
        ) : (
          <div className="grid place-items-center rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground shadow-xs">
            <div className="space-y-2">
              <Radio className="mx-auto h-8 w-8 text-muted-foreground/50 animate-pulse" />
              <p className="font-medium text-foreground">Awaiting live telemetry packet...</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Listening on path <code className="font-mono">loriotData</code> for device EUI <code className="font-mono">{eui}</code>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. SENSOR TREND CHARTS */}
      <SensorTrends
        fields={[ "transf_temperature", "cabinetHumidity" ]}
        windowMs={ONE_WEEK_MS}
        lineColor="teal"
      />

      {/* 4. LOCATION MAP */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Location & Installation</h2>
        <div className="h-80 overflow-hidden rounded-2xl border bg-card shadow-xs">
          <Map
            center={coords}
            zoom={16}
            markers={[ { id: transformer?.id || "nust", ...coords, label: `${name} (${type})` } ]}
            className="h-80"
          />
        </div>
      </section>
    </main>
  );
}
