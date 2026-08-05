import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import Map, { MapMarker } from "@/components/site/Map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useTransformers from "@/hooks/useTransformers";
import { useSensors } from "@/hooks/useSensors";
import { computePacketStatus } from "@/lib/status";
import { formatRelativeTime } from "@/lib/time";
import StatusPill from "@/components/site/StatusPill";

// The one transformer wired to the real live loriotData stream today — see the
// TODO in TransformerDetails.tsx and "Multi-Transformer Platform Restructure"
// in Questions.md for why this is a name match rather than a real id linkage.
const LOCAL_TRANSFORMER_NAME = "Local";

const DEFAULT_DRAFT_COORDS = { lat: -20.1626, lng: 28.6417 };

export default function TransformersPage() {

  const { transformers, loading, addTransformer } = useTransformers();
  const { sensorData, latestPacket } = useSensors();

  const lastSynced = latestPacket?.ts as number | undefined;
  const liveStatus = computePacketStatus( sensorData, lastSynced );

  const [ open, setOpen ] = useState( false );
  const [ search, setSearch ] = useState( "" );
  const [ submitting, setSubmitting ] = useState( false );
  const [ draft, setDraft ] = useState( { name: "", ...DEFAULT_DRAFT_COORDS } );

  const navigate = useNavigate();

  const markers: MapMarker[] = useMemo(

    () => [ { id: "draft", lat: draft.lat, lng: draft.lng, label: draft.name || "New transformer" } ],
    [ draft ],

  );

  const filtered = useMemo(

    () => transformers.filter( ( t ) => t.name.toLowerCase().includes( search.trim().toLowerCase() ) ),
    [ transformers, search ],

  );

  const liveCount = transformers.filter( ( t ) => t.name === LOCAL_TRANSFORMER_NAME ).length;
  const awaitingCount = transformers.length - liveCount;

  function rowLastReading( name: string ) {
    return name === LOCAL_TRANSFORMER_NAME ? lastSynced : undefined;
  }

  async function handleAddTransformer() {

    if ( !draft.name.trim() || submitting ) return;

    setSubmitting( true );

    try {
      await addTransformer( { name: draft.name.trim(), lat: draft.lat, lng: draft.lng } );
      setDraft( { name: "", ...DEFAULT_DRAFT_COORDS } );
      setOpen( false );
    } finally {
      setSubmitting( false );
    }

  }

  return (

    <main className="mx-auto max-w-7xl">

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transformers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading transformers..."
              : `${transformers.length} transformer${transformers.length === 1 ? "" : "s"} · ${liveCount} live · ${awaitingCount} awaiting data`}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>

          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Transformer
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl">

            <DialogHeader>
              <DialogTitle>Add Transformer</DialogTitle>
            </DialogHeader>

            <div className="mt-2 grid gap-3">

              <label className="grid gap-1 text-sm">

                <span>Name</span>

                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  placeholder="e.g. ZESA TX-102"
                  value={draft.name}
                  onChange={( e ) => setDraft( { ...draft, name: e.target.value } )}
                />

              </label>

              <div className="grid grid-cols-2 gap-3">

                <label className="grid gap-1 text-sm">

                  <span>Latitude</span>
                  <input
                    className="h-10 rounded-md border bg-background px-3 font-mono text-sm"
                    value={draft.lat}
                    readOnly
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Longitude</span>
                  <input
                    className="h-10 rounded-md border bg-background px-3 font-mono text-sm"
                    value={draft.lng}
                    readOnly
                  />
                </label>
              </div>

              <p className="text-xs text-muted-foreground">Click the map to set the transformer's location.</p>

              <div className="h-56 overflow-hidden rounded-xl border">
                <Map
                  center={{ lat: draft.lat, lng: draft.lng }}
                  markers={markers}
                  onSelect={( lat, lng ) => setDraft( { ...draft, lat, lng } )}
                  className="h-56"
                />
              </div>

              <div className="mt-1 text-right">
                <Button onClick={handleAddTransformer} disabled={!draft.name.trim() || submitting}>
                  {submitting ? "Saving..." : "Save Transformer"}
                </Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
          placeholder="Search transformers..."
          value={search}
          onChange={( e ) => setSearch( e.target.value )}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Location</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Last reading</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">

            {
              loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading transformers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {transformers.length === 0
                      ? "No transformers registered yet."
                      : "No transformers match your search."}
                  </td>
                </tr>
              ) : filtered.map( ( t ) => {

                const isLive = t.name === LOCAL_TRANSFORMER_NAME;
                const reading = rowLastReading( t.name );

                return (

                  <tr
                    key={t.id}
                    className="cursor-pointer transition-colors hover:bg-accent"
                    onClick={() => navigate( `/transformers/${t.id}` )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={( e ) => {
                      if ( e.key === "Enter" ) navigate( `/transformers/${t.id}` );
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-primary">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {t.lat.toFixed( 5 )}, {t.lng.toFixed( 5 )}
                    </td>
                    <td className="px-4 py-3">
                      {isLive ? (
                        <StatusPill status={liveStatus} size="sm" />
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-offline" aria-hidden />
                          Awaiting data
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {reading ? formatRelativeTime( reading ) : "No data yet"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      View →
                    </td>

                  </tr>
                );
              } )
            }

          </tbody>

        </table>

      </div>

    </main>

  );

}
