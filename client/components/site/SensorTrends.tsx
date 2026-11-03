import { useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Thermometer, Droplets, Zap, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import { useSensorHistoryStore } from "@/store/sensorStore";
import { sensorSchema, firebaseToLocalMap } from "@/lib/sensors";
import { isStale, metricStatus, StatusLevel, PLAUSIBILITY_BOUNDS } from "@/lib/status";
import { formatTimestamp } from "@/lib/time";
import StatusPill from "./StatusPill";

ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip );

// Time helpers
const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;

// Round timestamp to nearest 5 min
function roundTo5Min( ts: number ) {
    return Math.round( ts / FIVE_MIN ) * FIVE_MIN;
}

// Pick best max time window by dataset size
function pickTimeWindow( pointCount: number ) {
    if ( pointCount > 150 ) return ONE_DAY; // 24h
    if ( pointCount > 50 ) return ONE_DAY * 2; // 48h
    return ONE_WEEK; // last 7 days max
}

function schemaFor( field: string ) {
    const localKey = ( firebaseToLocalMap as Record<string, string> )[ field ];
    return sensorSchema.find( ( s ) => s.key === localKey ) as
        | { kind: "number" | "boolean"; normal?: [ number, number ]; min?: number; max?: number }
        | undefined;
}

// Status colors as raw hex — canvas/chart.js gradients need real color strings, not CSS vars
const STATUS_HEX: Record<"light" | "dark", Record<StatusLevel, string>> = {
    light: { normal: "#16A34A", warning: "#D97706", critical: "#DC2626", offline: "#94A3B8" },
    dark: { normal: "#22C55E", warning: "#F59E0B", critical: "#EF4444", offline: "#94A3B8" },
};

const CHARTS: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; title: string; field: string }[] = [
    { icon: Thermometer, title: "Cabinet Temp °C", field: "cabinetTemp" },
    { icon: Thermometer, title: "Transformer Temp °C", field: "transf_temperature" },
    { icon: Droplets, title: "Humidity %", field: "cabinetHumidity" },
    { icon: Zap, title: "Voltage V", field: "voltSensor" },
];

function percentile( sorted: number[], p: number ) {
    const idx = Math.min( sorted.length - 1, Math.max( 0, Math.round( p * ( sorted.length - 1 ) ) ) );
    return sorted[ idx ];
}

/** Hard y-axis bounds from the 95th/5th percentile of the non-fault values, with headroom. */
function faultAwareYBounds( cleanValues: number[] ): { min: number; max: number } | undefined {
    if ( cleanValues.length === 0 ) return undefined;

    const sorted = [ ...cleanValues ].sort( ( a, b ) => a - b );
    const p95 = percentile( sorted, 0.95 );
    const p05 = percentile( sorted, 0.05 );
    const span = p95 - p05 || Math.abs( p95 ) || 1;
    const pad = span * 0.2;

    return { min: p05 - pad, max: p95 + pad };
}

// Brand teal, used as the line stroke when `lineColor="teal"` — the area fill
// still tints by status color so the chart keeps conveying health at a glance.
const TEAL_HEX = { light: "#2563EB", dark: "#3B82F6" };

export default function SensorTrends( {
    fields,
    windowMs,
    lineColor = "status",
}: {
    /** Restrict to a subset of CHARTS by field name (Firebase-keyed). Defaults to all 4. */
    fields?: string[];
    /** Override the auto-picked time window (see pickTimeWindow) with a fixed one, e.g. 7 days. */
    windowMs?: number;
    /** "status" (default, matches existing pages) or "teal" (brand accent line, status-colored fill only). */
    lineColor?: "status" | "teal";
} = {} ) {
    const history = useSensorHistoryStore( ( s ) => s.history );
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const palette = STATUS_HEX[ isDark ? "dark" : "light" ];
    const tealColor = TEAL_HEX[ isDark ? "dark" : "light" ];
    const charts = fields ? CHARTS.filter( ( c ) => fields.includes( c.field ) ) : CHARTS;

    const gridColor = isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.08)";
    const tickColor = isDark ? "rgba(148, 163, 184, 0.85)" : "rgba(100, 116, 139, 0.9)";

    const baseOptions = useMemo(
        () => ( {
            backgroundColor: isDark ? "#0c1427" : "#FFFFFF",
            titleColor: isDark ? "#F8FAFC" : "#0F172A",
            bodyColor: isDark ? "#F8FAFC" : "#0F172A",
            borderColor: isDark ? "#1E293B" : "#E2E8F0",
        } ),
        [ isDark ],
    );

    if ( !history?.length ) {
        return (
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                No historical data yet
            </div>
        );
    }

    const sorted = [ ...history ]
        .sort( ( a, b ) => a.ts - b.ts )
        .map( ( p ) => ( { ...p, ts: roundTo5Min( p.ts ) } ) );

    // Window relative to the newest point in the dataset, not wall-clock "now" —
    // otherwise a stale dataset would filter down to nothing.
    const latestTs = sorted[ sorted.length - 1 ].ts;
    const window = windowMs ?? pickTimeWindow( sorted.length );
    const recent = sorted.filter( ( p ) => p.ts >= latestTs - window );

    if ( recent.length < 2 ) {
        return (
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                Waiting for more data...
            </div>
        );
    }

    const labels = recent.map( ( p ) =>
        new Date( p.ts ).toLocaleTimeString( [], {
            hour: "2-digit",
            minute: "2-digit",
        } ),
    );

    // Same staleness check as the rest of the page — a stale reading is shown
    // as "Stale" here too, not a confident Normal/Warning/Critical, so this
    // pill never contradicts the stat tiles or banner above it.
    const stale = isStale( latestTs );

    return (
        <section className="mt-6">
            <h2 className="text-lg font-semibold">Sensor Trends</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {
                    charts.map( ( { icon: Icon, title, field } ) => {
                        const schema = schemaFor( field );
                        const rawValues = recent.map( ( p ) => p.decoded?.[ field ] );
                        const latestValue = rawValues[ rawValues.length - 1 ];
                        const status: StatusLevel = stale
                            ? "offline"
                            : schema
                                ? metricStatus( latestValue, schema )
                                : "offline";
                        const statusColor = palette[ status ];
                        const color = lineColor === "teal" ? tealColor : statusColor;

                        const plausibility = PLAUSIBILITY_BOUNDS[ field ];
                        const faultIndices = new Set<number>();
                        const faults: { ts: number; v: number }[] = [];

                        if ( plausibility ) {
                            rawValues.forEach( ( v, i ) => {
                                if ( typeof v !== "number" ) return;
                                const isFault =
                                    ( plausibility.max !== undefined && v > plausibility.max ) ||
                                    ( plausibility.min !== undefined && v < plausibility.min );
                                if ( isFault ) {
                                    faultIndices.add( i );
                                    faults.push( { ts: recent[ i ].ts, v } );
                                }
                            } );
                        }

                        const cleanValues = rawValues.filter(
                            ( v, i ): v is number => typeof v === "number" && !faultIndices.has( i ),
                        );
                        const yBounds = faultIndices.size > 0 ? faultAwareYBounds( cleanValues ) : undefined;

                        const data = {
                            labels,
                            datasets: [
                                {
                                    data: rawValues.map( ( v ) => ( typeof v === "number" ? v : null ) ),
                                    borderColor: color,
                                    borderWidth: 1.8,
                                    tension: 0.32,
                                    pointRadius: rawValues.map( ( _, i ) => ( faultIndices.has( i ) ? 5 : 0 ) ),
                                    pointHoverRadius: rawValues.map( ( _, i ) => ( faultIndices.has( i ) ? 6 : 3 ) ),
                                    pointStyle: rawValues.map( ( _, i ) => ( faultIndices.has( i ) ? "triangle" : "circle" ) ),
                                    pointBackgroundColor: rawValues.map( ( _, i ) =>
                                        faultIndices.has( i ) ? palette.critical : color,
                                    ),
                                    pointBorderColor: rawValues.map( ( _, i ) =>
                                        faultIndices.has( i ) ? palette.critical : color,
                                    ),
                                    fill: true,
                                    backgroundColor: ( context: any ) => {
                                        const { chart } = context;
                                        const { ctx, chartArea } = chart;
                                        if ( !chartArea ) return undefined;
                                        const gradient = ctx.createLinearGradient( 0, chartArea.top, 0, chartArea.bottom );
                                        gradient.addColorStop( 0, `${statusColor}40` );
                                        gradient.addColorStop( 1, `${statusColor}00` );
                                        return gradient;
                                    },
                                },
                            ],
                        };

                        const options = {
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: { mode: "index" as const, intersect: false },
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    ...baseOptions,
                                    borderWidth: 1,
                                    padding: 8,
                                    titleFont: { family: "JetBrains Mono", size: 11 },
                                    bodyFont: { family: "JetBrains Mono", size: 11 },
                                    callbacks: {
                                        label: ( context: any ) =>
                                            faultIndices.has( context.dataIndex )
                                                ? `⚠ ${context.formattedValue} — outside plausible sensor range`
                                                : `${context.formattedValue}`,
                                    },
                                },
                            },
                            scales: {
                                x: {
                                    ticks: { color: tickColor, maxRotation: 0, autoSkip: true, font: { family: "JetBrains Mono", size: 10 } },
                                    grid: { display: false },
                                },
                                y: {
                                    ticks: { color: tickColor, font: { family: "JetBrains Mono", size: 10 } },
                                    grid: { color: gridColor },
                                    ...( yBounds ?? {} ),
                                },
                            },
                        };

                        const lastFault = faults[ faults.length - 1 ];

                        return (
                            <div key={field} className="rounded-xl border bg-card p-5">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                        <span>{title}</span>
                                    </div>
                                    <StatusPill status={status} size="sm" />
                                </div>

                                {lastFault && (
                                    <p className="mb-3 flex items-start gap-1.5 rounded-md bg-status-critical/10 px-2 py-1.5 text-xs font-medium text-status-critical ring-1 ring-inset ring-status-critical/30">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            Sensor fault detected — {faults.length} reading{faults.length > 1 ? "s" : ""} out of
                                            plausible range (latest <span className="font-mono">{lastFault.v}</span> at{" "}
                                            <span className="font-mono">{formatTimestamp( lastFault.ts )}</span>). Y-axis scaled to
                                            the 95th percentile so it doesn't flatten the rest of the trend.
                                        </span>
                                    </p>
                                )}

                                <div className="h-56">
                                    <Line data={data} options={options} />
                                </div>
                            </div>
                        );
                    } )
                }
            </div>
        </section>

    );
}
