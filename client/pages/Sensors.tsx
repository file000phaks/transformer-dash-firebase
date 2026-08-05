import {
  Activity,
  BellRing,
  ShieldAlert,
  Thermometer,
  Waves,
  Zap,
} from "lucide-react";
import useSensors from "@/hooks/useSensors";

const ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "DHT22": Thermometer,
  "Oil Level Sensor": Activity,
  "Current & Voltage Sensor": Zap,
  "Vibration Sensor": Waves,
  "Reed Switch": BellRing,
  "PIR Motion Sensor": ShieldAlert,
};

export default function SensorsPage() {

  const { sensors } = useSensors();

  if ( !sensors )
    return (
      <div className="text-sm text-muted-foreground">Loading sensors...</div>
    )

  return (

    <main className="mx-auto max-w-7xl">

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Sensors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The instruments installed on every monitored transformer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {
          sensors.map( ( s ) => {

            const Icon = ICONS[ s.name ] ?? Activity;

            return (
              <div key={s.name} className="rounded-xl border bg-card p-5 shadow-sm">

                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>

                <h3 className="mt-3 font-semibold">{s.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>

              </div>
            );

          } )
        }

      </div>

    </main>

  );

}
