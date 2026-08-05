import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  Droplets,
  ShieldAlert,
  Thermometer,
  Waves,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SensorMetric } from "@/types/SensorMetric";
import { SensorData } from "@shared/api";
import { firebaseToLocalMap, localToFirebaseMap } from "@/lib/sensors";
import { coerceBoolean, isImplausibleReading, metricStatus, STATUS_META, StatusLevel } from "@/lib/status";
import { formatShortAge } from "@/lib/time";
import type { LastKnownGood } from "@/hooks/useSensors";

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Activity,
  BellRing,
  Droplets,
  ShieldAlert,
  Thermometer,
  Waves,
  Zap,
}

// Top stat-tile row order, per the design brief's 9 named live sensor values
// (local schema keys).
const TILE_ORDER = [
  "cab_temperature",
  "cab_humidity",
  "trans_temperature",
  "oil",
  "door",
  "intruder",
  "vibration",
  "current",
  "voltage",
];

export default function MetricsGrid( {
  metrics,
  schema,
  className,
  onAlert,
  stale = false,
  freshness,
}: {
  // Despite the name, this is a keyed decoded-reading object (e.g. { cabinetTemp: 24.1, ... }),
  // never an array — `metrics[localToFirebaseMap[m.key]]` below always did object-key access.
  // Callers are expected to pass last-known-good (carried-forward) values here, not the raw
  // current record, so a tile keeps its last real reading through a record that's missing it.
  metrics?: Record<string, number | boolean>;
  schema?: any[];
  className?: string;
  onAlert?: ( opts: {
    key: string;
    label: string;
    value: number | boolean;
    severity: "warn" | "crit";
  } ) => void;
  stale?: boolean;
  // Keyed by Firebase field name (e.g. "cabinetTemp"), matching `metrics`'s own keys —
  // when each field's value in `metrics` was last actually updated. Optional so existing
  // callers without per-field freshness (if any) keep working unchanged.
  freshness?: LastKnownGood;
} ) {

  const [ values, setValues ] = useState<Record<string, number | boolean>>( {} );
  const triggeredRef = useRef<Record<string, boolean>>( {} );

  const [ sensorValues, setSensorValues ] = useState<SensorMetric[]>( [] )

  // One shared 1s re-render clock for the whole grid, rather than one interval per
  // tile, so every "last updated Xs ago" caption stays live between the underlying
  // 5s data ticks without redundant timers.
  const [ , forceRerender ] = useState( 0 );
  useEffect( () => {
    const id = setInterval( () => forceRerender( ( t ) => t + 1 ), 1000 );
    return () => clearInterval( id );
  }, [] );

  // Initialize values
  useEffect( () => {

    if ( metrics && schema ) {

      const init: Record<string, number | boolean> = {};

      const formattedMetrics: SensorMetric[] = schema.map( item => ( {
        ...item,
        icon: iconMap[ item.icon ]
      } ) )


      // For real data, get firebase data
      for ( const m of formattedMetrics ) {

        init[ m.key ] = metrics[ localToFirebaseMap[ m.key ] ];


      }

      setSensorValues( formattedMetrics );

      setValues( init );

    }

  }, [ metrics ] );

  // After values update, compute alerts and notify parent (async to avoid render-phase updates)
  useEffect( () => {

    if ( !onAlert ) return;

    const notify = ( payload: {
      key: string;
      label: string;
      value: number | boolean;
      severity: "warn" | "crit";
    } ) => {
      Promise.resolve().then( () => onAlert( payload ) );
    };

    const flags = { ...triggeredRef.current };

    for ( const m of sensorValues ) {

      const v = values[ m.key ];

      if ( m.kind === "number" && typeof v === "number" && m.normal ) {

        const [ lo, hi ] = m.normal;
        const out = v < lo || v > hi;

        if ( out && !flags[ m.key ] ) {

          flags[ m.key ] = true;
          notify( {
            key: m.key,
            label: m.label,
            value: v,
            severity: v > hi ? "crit" : "warn",
          } );
        }

        if ( !out ) flags[ m.key ] = false;

      }

      if ( m.kind === "boolean" ) {

        // door/PIR arrive from Firebase as numeric 0|1, not native true/false —
        // `v === true`/`v === false` never matched a real reading, so these
        // alerts silently never fired. coerceBoolean() treats either
        // representation the same; undefined (missing) leaves flags untouched.
        const bool = coerceBoolean( v );

        if ( bool === true && !flags[ m.key ] ) {

          // Fire on true only; auto-reset on next false
          flags[ m.key ] = true;
          notify( { key: m.key, label: m.label, value: true, severity: "crit" } );

        } else if ( bool === false ) {

          flags[ m.key ] = false;

        }

      }

    }

    triggeredRef.current = flags;

  }, [ values, sensorValues, onAlert ] );


  const cards = useMemo(

    () => sensorValues
      .map( ( m ) => {
        const fbKey = localToFirebaseMap[ m.key ];
        return {
          m,
          v: values[ m.key ],
          updatedAt: freshness?.[ fbKey ]?.updatedAt,
          isAnomalous: isImplausibleReading( values[ m.key ], fbKey ),
        };
      } )
      .filter( ( { m } ) => TILE_ORDER.includes( m.key ) )
      .sort( ( a, b ) => TILE_ORDER.indexOf( a.m.key ) - TILE_ORDER.indexOf( b.m.key ) ),

    [ sensorValues, values, freshness ],

  );

  if ( !sensorValues )

    return (
      <div>
        <p>Loading sensor data...</p>
      </div>
    )

  return (

    <div
      className={cn(
        "grid grid-cols-2 gap-4 lg:grid-cols-4",
        className,
      )}
    >
      {
        cards.map( ( { m, v, updatedAt, isAnomalous } ) => (
          <MetricCard key={m.key} metric={m} value={v} stale={stale} updatedAt={updatedAt} isAnomalous={isAnomalous} />
        ) )
      }
    </div>

  );
}

function statusFor( metric: SensorMetric, value: number | boolean | undefined, stale: boolean ): StatusLevel {

  if ( stale ) return "offline";

  return metricStatus( value, metric );

}

function MetricCard( {
  metric,
  value,
  stale,
  updatedAt,
  isAnomalous = false,
}: {
  metric: SensorMetric;
  value: number | boolean | undefined;
  stale: boolean;
  updatedAt?: number;
  isAnomalous?: boolean;
} ) {

  const Icon = metric.icon;

  const isBool = metric.kind === "boolean";

  const status = statusFor( metric, value, stale );
  const meta = STATUS_META[ status ];

  // ~1-2% of real records are missing individual `decoded` fields (confirmed
  // live, see Questions.md "Firebase Schema Hardening"). A missing boolean
  // reading is `undefined`/`null`, not `0`/`false` — door/PIR arrive from
  // Firebase as numeric 0|1, not native JS booleans, so this must coerce
  // rather than require `typeof value === "boolean"` (see "Boolean Field Bug
  // Fix" in Questions.md — that stricter check never matched a real reading).
  const boolValue = isBool ? coerceBoolean( value ) : undefined;
  const text = isBool
    ? boolValue === undefined
      ? "—"
      : boolValue
        ? "TRIGGERED"
        : "CLEAR"
    : typeof value === "number"
      ? value.toFixed( 1 )
      : "—";

  return (

    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 pl-5 shadow-sm",
        isAnomalous && "animate-anomaly-pulse",
      )}
    >

      <span className={cn( "absolute inset-y-0 left-0 w-1", meta.dot )} aria-hidden />

      <div className="flex items-start justify-between gap-2">

        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate text-xs font-medium uppercase tracking-wide">
            {metric.label}
          </span>
        </div>

        <span className={cn( "h-2 w-2 shrink-0 rounded-full", meta.dot )} aria-hidden />

      </div>

      <p className="mt-3 font-mono text-2xl font-semibold leading-tight tracking-tight">
        {text}
        {!isBool && metric.unit && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">{metric.unit}</span>
        )}
      </p>

      <p className={cn( "mt-1 text-xs font-medium", meta.text )}>{meta.label}</p>

      {/* Per-field freshness — a normal live-dashboard caption, not a stale-data
          alarm. Only rendered once this field has actually had a value at least
          once (per-field "—" already covers the never-had-a-value case above). */}
      {updatedAt && (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          Updated {formatShortAge( updatedAt )}
        </p>
      )}

      {/* The pulse above is the anomaly indicator itself; this caption just explains
          why it's pulsing — layered on top of, not instead of, the normal/warning/
          critical status label above, so a tile can read e.g. "Critical" AND
          "Anomalous reading" at the same time. */}
      {isAnomalous && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-status-critical">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Anomalous reading
        </p>
      )}

    </div>

  );

}
