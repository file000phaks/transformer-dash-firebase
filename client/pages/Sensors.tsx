import useSensors from "@/hooks/useSensors";

export default function SensorsPage() {

  const { sensors } = useSensors();

  if ( !sensors )
    return (
      <div>Loading sensors...</div>
    )

  return (

    <main className="container mx-auto py-10">

      <h1 className="text-2xl font-bold tracking-tight">Sensors</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

        {
          sensors.map( ( s ) => (

            <div key={s.name} className="rounded-xl border bg-card p-5">

              <h3 className="font-semibold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>

            </div>
          ) )
        }

      </div>

    </main>

  );

}
