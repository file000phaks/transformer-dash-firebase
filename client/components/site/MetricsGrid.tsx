import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
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

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Activity,
  BellRing,
  Droplets,
  ShieldAlert,
  Thermometer,
  Waves,
  Zap,
}

function rand( min: number, max: number ) {
  return Math.round( min + Math.random() * ( max - min ) );
}

export default function MetricsGrid( {
  metrics,
  schema,
  className,
  onAlert,
}: {
  metrics?: any[];
  schema?: any[];
  className?: string;
  onAlert?: ( opts: {
    key: string;
    label: string;
    value: number | boolean;
    severity: "warn" | "crit";
  } ) => void;
} ) {

  const [ values, setValues ] = useState<Record<string, number | boolean>>( {} );
  const triggeredRef = useRef<Record<string, boolean>>( {} );

  const [ sensorValues, setSensorValues ] = useState<SensorMetric[]>( [] )

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

      if ( m.kind === "boolean" && v === true ) {

        // Fire on true only; auto-reset on next false
        if ( !flags[ m.key ] ) {
          flags[ m.key ] = true;
          notify( { key: m.key, label: m.label, value: true, severity: "crit" } );
        }

      }
      if ( m.kind === "boolean" && v === false ) {

        flags[ m.key ] = false;

      }

    }

    triggeredRef.current = flags;

  }, [ values, sensorValues, onAlert ] );


  const cards = useMemo(

    () => sensorValues.map( ( m ) => ( { m, v: values[ m.key ] } ) ),

    [ sensorValues, values ],

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
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {
        cards.map( ( { m, v } ) => (
          <MetricCard key={m.key} metric={m} value={v} />
        ) )
      }
    </div>

  );
}

function badgeColor( metric: SensorMetric, val: number | boolean | undefined ) {

  if ( metric.kind === "boolean" )

    return val
      ? "bg-red-500/10 text-red-600 ring-red-500/30"
      : "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30";

  if ( typeof val !== "number" || !metric.normal )

    return "bg-muted text-muted-foreground";

  const [ lo, hi ] = metric.normal;

  if ( val < lo ) return "bg-amber-500/10 text-amber-600 ring-amber-500/30";

  if ( val > hi ) return "bg-red-500/10 text-red-600 ring-red-500/30";

  return "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30";

}

function MetricCard( {
  metric,
  value,
}: {
  metric: SensorMetric;
  value: number | boolean | undefined;
} ) {

  const Icon = metric.icon;

  const isBool = metric.kind === "boolean";

  const text = isBool
    ? ( value as boolean )
      ? "Alert"
      : "Normal"
    : `${value ?? "--"}${metric.unit ?? ""}`;

  return (

    <div className="rounded-xl border bg-card p-5 shadow-sm">

      <div className="flex items-start justify-between gap-3">

        <div className="flex min-w-0 items-center gap-4">

          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">

            <Icon className="h-5 w-5" />

          </span>

          <div className="min-w-0 break-words">

            <p className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </p>

            <p className="mt-1 text-lg font-semibold leading-tight">{text}</p>

          </div>

        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs ring-1",
            badgeColor( metric, value ),
          )}
        >
          {isBool ? ( ( value as boolean ) ? "Triggered" : "OK" ) : "Live"}

        </span>

      </div>

    </div>

  );

}
