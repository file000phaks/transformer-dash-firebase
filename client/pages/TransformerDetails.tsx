import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Transformer } from "@/types/transformer";
import { loadTransformers } from "@/lib/storage";
import MetricsGrid from "@/components/site/MetricsGrid";
import Map from "@/components/site/Map";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/state/notifications";
import { toast } from "sonner";
import { SensorMetric } from "@/types/SensorMetric";
import { useSensors } from "@/hooks/useSensors";
import useTransformers from "@/hooks/useTransformers";

export default function TransformerDetails() {

  const { id } = useParams();

  const { sensorSchema, sensorData } = useSensors();
  const { transformer, transformers, getTransformerById } = useTransformers( 1 );

  useEffect( () => {

    getTransformerById( parseInt( id ) );

  }, [ transformers ] )

  // const { addAlert } = useNotifications();

  // function handleAlert( a: {
  //   key: string;
  //   label: string;
  //   value: number | boolean;
  //   severity: "warn" | "crit";
  // } ) {

  //   const unitMap: Record<string, string> = {
  //     temperature: "°C",
  //     humidity: "%",
  //     vibration: "mm/s",
  //     oil: "%",
  //     voltage: "V",
  //     current: "A",
  //   };

  //   const unit = unitMap[ a.key ] || "";

  //   const msg =

  //     typeof a.value === "number"
  //       ? `${a.label} reading ${a.value}${unit} is outside normal range.`
  //       : `${a.label} event detected.`;
  //   addAlert( {
  //     ...a,
  //     transformerId: String( transformer?.id ),
  //     transformerName: transformer?.name,
  //     lat: transformer?.lat,
  //     lng: transformer?.lng,
  //     message: msg,
  //   } );

  //   toast( `${a.label} ${a.severity === "crit" ? "Critical" : "Warning"}`, {
  //     description: `${transformer?.name ?? "Unknown"} • ${msg}`,
  //   } );

  // }

  if ( !transformer ) {

    return (

      <main className="container mx-auto py-8">
        <p className="text-sm text-muted-foreground">Transformer not found.</p>
        <Link
          to="/transformers"
          className="mt-3 inline-block text-primary underline"
        >
          Back to Transformers
        </Link>
      </main>
    );
  }

  return (

    <main className="container mx-auto grid gap-6 py-8 xl:grid-cols-2">

      <div className="xl:col-span-2">

        <div className="flex items-center justify-between">

          <h1 className="text-2xl font-bold tracking-tight">  {transformer.name}  </h1>

          <Link to="/transformers">
            <Button variant="outline">Back</Button>
          </Link>

        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {transformer.lat.toFixed( 5 )}, {transformer.lng.toFixed( 5 )}
        </p>

        <div className="mt-4 h-64 overflow-hidden rounded-xl border">
          <Map
            center={{ lat: transformer.lat, lng: transformer.lng }}
            markers={[
              {
                id: String( transformer.id ),
                lat: transformer.lat,
                lng: transformer.lng,
              },
            ]}
            className="h-64"
          />
        </div>
        <h2 className="mt-6 text-lg font-semibold">Live Telemetry</h2>

        {
          sensorData ?
            (
              <MetricsGrid
                className="mt-3"
                // onAlert={handleAlert}
                onAlert={() => {}}
                schema={sensorSchema}
                metrics={sensorData}
                
              />
            )
            :
            (
              <p>Loading live sensor data...</p>
            )
        }

      </div>
      <aside className="grid gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Status</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Operating Normally
          </p>

        </div>
      </aside>
    </main>

  );

}
