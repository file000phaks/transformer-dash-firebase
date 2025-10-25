import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Thermometer, Droplets, Zap } from "lucide-react";
import { useSensorHistoryStore } from "@/store/sensorStore";
import { sortedArray } from "three/src/animation/AnimationUtils.js";

ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Tooltip );

// Visual style
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: {
            ticks: { color: "rgba(200,200,200,0.45)", maxRotation: 0, autoSkip: true },
            grid: { display: false },
        },
        y: {
            ticks: { color: "rgba(200,200,200,0.45)" },
            grid: { color: "rgba(255,255,255,0.06)" },
        },
    },
};

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

export default function SensorTrends() {
    const history = useSensorHistoryStore( ( s ) => s.history );

    if ( !history?.length ) {
        return (
            <div className="rounded-xl border p-4 text-muted-foreground">
                No historical data yet
            </div>
        );
    }

    const sorted = [ ...history ]
        .sort( ( a, b ) => a.ts - b.ts )
        .map( ( p ) => ( { ...p, ts: roundTo5Min( p.ts ) } ) );

    const window = pickTimeWindow( sorted.length );
    const now = Date.now();
    const recent = [ ...sorted ];
    //   const recent = sorted.filter((p) => p.ts >= now - window);

    console.log( recent.length )

    if ( recent.length < 2 ) {
        return (
            <div className="rounded-xl border p-4 text-muted-foreground">
                Waiting for more data...
            </div>
        );
    }

    const labels = recent.map( ( p ) =>
        new Date( p.ts ).toLocaleTimeString( [], {
            hour: "2-digit",
            minute: "2-digit",
        } )
    );

    const build = ( field: string, color: string ) => ( {
        labels,
        datasets: [
            {
                data: recent.map( ( p ) => p.decoded[ field ] ?? null ),
                borderColor: color,
                borderWidth: 1.8,
                tension: 0.32,
                pointRadius: 1,
            },
        ],
    } );

    const ChartBox = ( { icon: Icon, title, keyName, color } ) => (
        <div className="rounded-xl border bg-card p-7 h-64">
            <div className="flex items-center gap-2 text-sm mb-2">
                <Icon className="w-3 h-3" style={{ color }} />
                <span>{title}</span>
            </div>
            <Line data={build( keyName, color )} options={chartOptions} />
        </div>
    );

    return (
        <section className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Sensor Trends</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ChartBox
                    icon={Thermometer}
                    title="Cabinet Temp °C"
                    keyName="cabinetTemp"
                    color="rgba(0,200,255,0.9)"
                />
                <ChartBox
                    icon={Thermometer}
                    title="Transformer Temp °C"
                    keyName="transf_temperature"
                    color="rgba(30,144,255,0.9)"
                />
                <ChartBox
                    icon={Droplets}
                    title="Humidity %"
                    keyName="cabinetHumidity"
                    color="rgba(0,255,200,0.9)"
                />
                <ChartBox
                    icon={Zap}
                    title="Voltage V"
                    keyName="voltSensor"
                    color="rgba(255,215,0,0.95)"
                />
            </div>
        </section>

    );
}
