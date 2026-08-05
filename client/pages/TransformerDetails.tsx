import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";
import Map from "@/components/site/Map";
import useTransformers from "@/hooks/useTransformers";
import Dashboard from "./Dashboard";

// There is currently NO way to associate a loriotData reading with a specific
// transformer — the physical device writes {ts, decoded} with no transformer
// id field at all. Rather than fabricate that linkage, "Local" (the existing
// NUST unit) is treated as the one hardcoded transformer wired to the real
// live stream; every other transformer (including anything created via "Add
// Transformer") shows the "no live data yet" state below instead.
//
// TODO(multi-device support): for this to generalize, each physical device
// would need to write its transformerId alongside ts/decoded in loriotData
// (or write to a per-transformer sub-path, e.g. loriotData/<transformerId>/...),
// and useSensors()/this page would need to filter/query loriotData scoped to
// the selected transformer's id instead of matching on this hardcoded name.
// Out of scope for this round — see "Multi-Transformer Platform Restructure"
// in Questions.md.
const LOCAL_TRANSFORMER_NAME = "Local";

function BackButton() {
  return (
    <Link to="/" className="inline-block">
      <Button variant="outline" size="sm" className="mb-4 gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Transformers
      </Button>
    </Link>
  );
}

export default function TransformerDetails() {

  const { id } = useParams();
  const { transformer, loading } = useTransformers( id );

  if ( loading ) {

    return (
      <main className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-muted-foreground">Loading transformer...</p>
      </main>
    );

  }

  if ( !transformer ) {

    return (

      <main className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-muted-foreground">Transformer not found.</p>
        <Link
          to="/"
          className="mt-3 inline-block text-primary underline"
        >
          Back to Transformers
        </Link>
      </main>
    );
  }

  // The one transformer with a real wired data source — reuse the existing
  // dashboard layout (health score, metrics grid, PDF report, sensor trends,
  // anomaly indicator, per-field freshness) exactly as it already works.
  if ( transformer.name === LOCAL_TRANSFORMER_NAME ) {

    return (
      <div>
        <div className="mx-auto max-w-7xl">
          <BackButton />
        </div>
        <Dashboard />
      </div>
    );

  }

  return (

    <main className="mx-auto max-w-7xl">

      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{transformer.name}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {transformer.lat.toFixed( 5 )}, {transformer.lng.toFixed( 5 )}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card p-10 text-center">
        <RadioTower className="h-8 w-8 text-muted-foreground" />
        <p className="font-medium">No live data yet — awaiting device connection</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This transformer isn't linked to a reporting device yet. Once its hardware
          starts sending readings, live telemetry, trends, and health scoring will
          appear here automatically.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Location</h2>
        <div className="mt-3 h-72 overflow-hidden rounded-xl border">
          <Map
            center={{ lat: transformer.lat, lng: transformer.lng }}
            markers={[
              {
                id: transformer.id,
                lat: transformer.lat,
                lng: transformer.lng,
                label: transformer.name,
              },
            ]}
            className="h-72"
          />
        </div>
      </section>

    </main>

  );

}
