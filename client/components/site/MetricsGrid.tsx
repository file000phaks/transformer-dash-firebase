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
import { localToFirebaseMap } from "@/lib/sensors";
import { coerceBoolean, isImplausibleReading, metricStatus, StatusLevel } from "@/lib/status";
import { formatShortAge } from "@/lib/time";
import type { LastKnownGood } from "@/hooks/useSensors";
import StatusPill from "./StatusPill";

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Activity,
  BellRing,
  Droplets,
  ShieldAlert,
  Thermometer,
  Waves,
  Zap,
};

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
  // Keyed decoded-reading object (e.g. { cabinetTemp: 24.1, ... }).
  // Callers are expected to pass last-known-good values here.
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
  freshness?: LastKnownGood;
} ) {
  const [ values, setValues ] = useState<Record<string, number | boolean>>( {} );
  const triggeredRef = useRef<Record<string, boolean>>( {} );
  const [ sensorValues, setSensorValues ] = useState<SensorMetric[]>( [] );

  // Shared 1s re-render clock for the whole grid
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
      } ) );

      for ( const m of formattedMetrics ) {
        init[ m.key ] = metrics[ localToFirebaseMap[ m.key ] ];
      }

      setSensorValues( formattedMetrics );
      setValues( init );
    }
  }, [ metrics, schema ] );

  // After values update, compute alerts and notify parent
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
        const bool = coerceBoolean( v );
        if ( bool === true && !flags[ m.key ] ) {
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

  if ( !sensorValues.length ) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Loading sensor data...
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4",
        className,
      )}
    >
      {cards.map( ( { m, v, updatedAt, isAnomalous } ) => (
        <MetricCard
          key={m.key}
          metric={m}
          value={v}
          stale={stale}
          updatedAt={updatedAt}
          isAnomalous={isAnomalous}
        />
      ) )}
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

  const boolValue = isBool ? coerceBoolean( value ) : undefined;

  let displayValue: string;
  let isAlertState = false;

  if ( isBool ) {
    if ( boolValue === undefined ) {
      displayValue = "—";
    } else if ( boolValue ) {
      isAlertState = true;
      displayValue = metric.key === "door" ? "Open" : metric.key === "intruder" ? "Detected" : "Triggered";
    } else {
      displayValue = metric.key === "door" ? "Closed" : metric.key === "intruder" ? "Clear" : "Normal";
    }
  } else if ( typeof value === "number" ) {
    displayValue = value.toFixed( 1 );
    if ( status === "critical" || status === "warning" ) {
      isAlertState = true;
    }
  } else {
    displayValue = "—";
  }

  // Soft icon tone styling based on status
  const iconTone =
    status === "critical"
      ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
      : status === "warning"
        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        : status === "normal"
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700/80",
        isAnomalous && "animate-anomaly-pulse",
      )}
    >
      {/* Top Header: Normal case sensor label and soft icon container */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-muted-foreground" title={metric.label}>
          {metric.label}
        </span>
        <div className={cn( "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105", iconTone )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="my-3">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-mono font-bold tracking-tight",
              isBool ? "text-xl font-semibold" : "text-2xl sm:text-3xl",
              isAlertState ? "text-status-critical" : "text-foreground",
            )}
          >
            {displayValue}
          </span>
          {!isBool && metric.unit && (
            <span className="text-xs font-medium text-muted-foreground">
              {metric.unit}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Compact status pill and relative age */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/50">
        <StatusPill status={status} size="sm" />

        {updatedAt ? (
          <span className="text-[11px] font-mono text-muted-foreground">
            {formatShortAge( updatedAt )}
          </span>
        ) : (
          <span className="text-[11px] font-mono text-muted-foreground/60">—</span>
        )}
      </div>

      {/* Anomaly warning caption if sensor value is implausible */}
      {isAnomalous && (
        <p className="mt-2 flex items-center gap-1 rounded-md bg-status-critical/10 px-2 py-1 text-[11px] font-medium text-status-critical ring-1 ring-inset ring-status-critical/20">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Anomalous reading
        </p>
      )}
    </div>
  );
}
