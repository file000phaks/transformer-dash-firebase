import { Thermometer, Droplets, Zap } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useSensorHistoryStore } from "@/store/sensorStore";

// Time helpers
const FIVE_MIN = 5 * 60 * 1000;

// Round timestamp to nearest 5 min
function roundTo5Min( ts: number ) {
    return Math.round( ts / FIVE_MIN ) * FIVE_MIN;
}

interface ChartBoxProps {
    icon: React.ElementType;
    title: string;
    keyName: string;
    color: string;
    data: { label: string; value: number | null }[];
}

const ChartBox = ( { icon: Icon, title, keyName, color, data }: ChartBoxProps ) => (
    <div className="rounded-xl border bg-card p-4 h-64">
        <div className="flex items-center gap-2 text-sm mb-3">
            <Icon className="w-3 h-3" style={{ color }} />
            <span>{title}</span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeOpacity={0.06} vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(200,200,200,0.45)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                />
                <YAxis
                    tick={{ fill: "rgba(200,200,200,0.45)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 11,
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.8}
                    dot={false}
                    activeDot={{ r: 3 }}
                    connectNulls
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export default function SensorTrends() {
    const history = useSensorHistoryStore( ( s: any ) => s.history );

    if ( !history?.length ) {
        return (
            <div className="rounded-xl border p-4 text-muted-foreground">
                No historical data yet
            </div>
        );
    }

    const sorted = [ ...history ]
        .sort( ( a: any, b: any ) => a.ts - b.ts )
        .map( ( p: any ) => ( { ...p, ts: roundTo5Min( p.ts ) } ) );

    if ( sorted.length < 2 ) {
        return (
            <div className="rounded-xl border p-4 text-muted-foreground">
                Waiting for more data...
            </div>
        );
    }

    const buildData = ( field: string ) =>
        sorted.map( ( p: any ) => ( {
            label: new Date( p.ts ).toLocaleTimeString( [], {
                hour: "2-digit",
                minute: "2-digit",
            } ),
            value: p.decoded?.[ field ] ?? null,
        } ) );

    return (
        <section className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Sensor Trends</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ChartBox
                    icon={Thermometer}
                    title="Cabinet Temp °C"
                    keyName="cabinetTemp"
                    color="rgba(0,200,255,0.9)"
                    data={buildData( "cabinetTemp" )}
                />
                <ChartBox
                    icon={Thermometer}
                    title="Transformer Temp °C"
                    keyName="transf_temperature"
                    color="rgba(30,144,255,0.9)"
                    data={buildData( "transf_temperature" )}
                />
                <ChartBox
                    icon={Droplets}
                    title="Humidity %"
                    keyName="cabinetHumidity"
                    color="rgba(0,255,200,0.9)"
                    data={buildData( "cabinetHumidity" )}
                />
                <ChartBox
                    icon={Zap}
                    title="Voltage V"
                    keyName="voltSensor"
                    color="rgba(255,215,0,0.95)"
                    data={buildData( "voltSensor" )}
                />
            </div>
        </section>
    );
}
