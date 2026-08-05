import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import useTransformers from "@/hooks/useTransformers";
import { useSensors } from "@/hooks/useSensors";
import Map from "@/components/site/Map";
import StatusPill from "@/components/site/StatusPill";
import { StaleBadge } from "@/components/site/StaleBanner";
import { computePacketStatus } from "@/lib/status";
import { formatRelativeTime } from "@/lib/time";

export default function FleetMap() {

  const { transformers } = useTransformers();
  const { sensorData, latestPacket } = useSensors();
  const navigate = useNavigate();

  const lastSynced = latestPacket?.ts as number | undefined;
  const status = computePacketStatus( sensorData, lastSynced );

  const first = transformers[ 0 ];

  return (

    <main className="mx-auto max-w-7xl">

      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Location of every monitored transformer.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">

        <div className="h-[32rem] overflow-hidden rounded-xl border bg-muted lg:h-[36rem]">
          {
            first ? (
              // react-leaflet only applies `center` on initial mount, so the map
              // isn't rendered until a real transformer location is available —
              // otherwise it would mount centered on Map.tsx's placeholder default
              // and never recenter once the real data arrives.
              <Map
                center={{ lat: first.lat, lng: first.lng }}
                markers={transformers.map( ( t ) => ( { id: String( t.id ), lat: t.lat, lng: t.lng, label: t.name } ) )}
                className="h-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading transformer locations...
              </div>
            )
          }
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-3 text-sm font-medium">
            Transformers ({transformers.length})
          </div>

          {
            transformers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No transformers registered.</p>
            ) : (
              <ul className="divide-y">
                {
                  transformers.map( ( t ) => (
                    <li key={t.id}>
                      <button
                        onClick={() => navigate( `/transformers/${t.id}` )}
                        className="group flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-accent"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{t.name}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            {formatRelativeTime( lastSynced )}
                            <StaleBadge ts={lastSynced} />
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusPill status={status} size="sm" />
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                        </div>
                      </button>
                    </li>
                  ) )
                }
              </ul>
            )
          }
        </div>

      </div>

    </main>

  );

}
