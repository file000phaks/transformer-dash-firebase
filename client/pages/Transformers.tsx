import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Globe,
  Radio,
  Server,
  Plus,
  Search,
  Eye,
  Trash2,
  ListFilter,
  ShieldCheck,
  ShieldOff,
  Wrench,
  Activity,
  Cpu,
  MapPin,
  Building,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const LOCAL_TRANSFORMER_NAME = "Local";
const DEFAULT_DRAFT_COORDS = { lat: -20.1626, lng: 28.6417 };

export default function TransformersPage() {
  const { transformers, loading, addTransformer, deleteTransformer, toggleArmed, toggleMode } = useTransformers();
  const { sensorData, latestPacket } = useSensors();

  const lastSynced = latestPacket?.ts as number | undefined;
  const liveStatus = computePacketStatus( sensorData, lastSynced );

  const [ open, setOpen ] = useState( false );
  const [ search, setSearch ] = useState( "" );
  const [ submitting, setSubmitting ] = useState( false );
  const [ draft, setDraft ] = useState( {
    name: "",
    city: "Bulawayo",
    suburb: "CBD",
    eui: "wwwwwwwwwwwwwww",
    type: "GMT",
    armed: true,
    mode: "normal" as "normal" | "maintenance",
    ...DEFAULT_DRAFT_COORDS,
  } );

  const navigate = useNavigate();

  const markers: MapMarker[] = useMemo(
    () => [ { id: "draft", lat: draft.lat, lng: draft.lng, label: draft.name || "New transformer" } ],
    [ draft ]
  );

  const filtered = useMemo(
    () =>
      transformers.filter( ( t ) =>
        ( t.name || "" ).toLowerCase().includes( search.trim().toLowerCase() ) ||
        ( t.city || "" ).toLowerCase().includes( search.trim().toLowerCase() ) ||
        ( t.suburb || "" ).toLowerCase().includes( search.trim().toLowerCase() ) ||
        ( t.eui || "" ).toLowerCase().includes( search.trim().toLowerCase() )
      ),
    [ transformers, search ]
  );

  const liveCount = transformers.filter( ( t ) => t.name === LOCAL_TRANSFORMER_NAME || ( latestPacket && latestPacket.eui === t.eui ) ).length;
  const armedCount = transformers.filter( ( t ) => t.armed ).length;
  const maintenanceCount = transformers.filter( ( t ) => t.mode === "maintenance" ).length;
  const awaitingCount = Math.max( 0, transformers.length - liveCount );

  function rowLastReading( t: { name: string; eui: string } ) {
    if ( latestPacket?.eui && t.eui && latestPacket.eui.toLowerCase() === t.eui.toLowerCase() ) {
      return latestPacket.ts;
    }
    return t.name === LOCAL_TRANSFORMER_NAME ? lastSynced : undefined;
  }

  async function handleAddTransformer() {
    if ( !draft.name.trim() || submitting ) return;
    setSubmitting( true );
    try {
      await addTransformer( {
        name: draft.name.trim(),
        city: draft.city.trim() || "Bulawayo",
        suburb: draft.suburb.trim() || "CBD",
        eui: draft.eui.trim() || "wwwwwwwwwwwwwww",
        type: draft.type.trim() || "GMT",
        lat: draft.lat,
        lng: draft.lng,
        armed: draft.armed,
        mode: draft.mode,
      } );
      setDraft( {
        name: "",
        city: "Bulawayo",
        suburb: "CBD",
        eui: "wwwwwwwwwwwwwww",
        type: "GMT",
        armed: true,
        mode: "normal",
        ...DEFAULT_DRAFT_COORDS,
      } );
      setOpen( false );
    } finally {
      setSubmitting( false );
    }
  }

  async function handleDeleteTransformer( e: React.MouseEvent, id: string, name: string ) {
    e.stopPropagation();
    if ( window.confirm( `Delete transformer "${name}"?` ) ) {
      await deleteTransformer( id );
    }
  }

  async function handleToggleArmed( e: React.MouseEvent, id: string, currentArmed: boolean ) {
    e.stopPropagation();
    await toggleArmed( id, currentArmed );
  }

  async function handleToggleMode( e: React.MouseEvent, id: string, currentMode: "normal" | "maintenance" ) {
    e.stopPropagation();
    await toggleMode( id, currentMode );
  }

  const coveragePercent = transformers.length > 0
    ? Math.round( ( filtered.length / transformers.length ) * 100 )
    : 0;

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      {/* 1. TOP STAT CARDS ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Units */}
        <div className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Transformers</h2>
            <p className="mt-1 text-xs text-muted-foreground">{transformers.length} registered in network</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Radio className="h-4 w-4" />
          </div>
        </div>

        {/* Card 2: Armed Perimeter Status */}
        <div className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? "..." : `${armedCount} / ${transformers.length}`}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Security perimeters armed
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>

        {/* Card 3: Maintenance Units */}
        <div className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? "..." : maintenanceCount}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {maintenanceCount === 1 ? "1 unit in maintenance" : `${maintenanceCount} units in maintenance`}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Wrench className="h-4 w-4" />
          </div>
        </div>

        {/* Card 4: Live Telemetry */}
        <div className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? "..." : liveCount}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {liveCount} actively streaming
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Server className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: TRANSFORMERS TABLE */}
      <div className="rounded-2xl border bg-card shadow-xs">
        {/* Table Header Section */}
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              FLEET INVENTORY & CONTROLS
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-foreground">
              Registered Transformers
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage equipment locations, device EUIs, operational maintenance modes, and armed security states.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/60 px-3 py-1 text-xs font-semibold text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
              <Globe className="h-3.5 w-3.5" />
              {transformers.length} in scope
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
              <ListFilter className="h-3.5 w-3.5" />
              {filtered.length} visible
            </span>

            {/* Add Transformer Button & Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-xs">
                  <Plus className="h-4 w-4" />
                  Add Transformer
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Transformer Unit</DialogTitle>
                </DialogHeader>

                <div className="mt-3 grid gap-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Transformer Name</label>
                      <input
                        className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Substation Unit 2"
                        value={draft.name}
                        onChange={( e ) => setDraft( { ...draft, name: e.target.value } )}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Type</label>
                      <input
                        className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. GMT"
                        value={draft.type}
                        onChange={( e ) => setDraft( { ...draft, type: e.target.value } )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">City</label>
                      <input
                        className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Bulawayo"
                        value={draft.city}
                        onChange={( e ) => setDraft( { ...draft, city: e.target.value } )}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Suburb / District</label>
                      <input
                        className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. NUST / Belmont"
                        value={draft.suburb}
                        onChange={( e ) => setDraft( { ...draft, suburb: e.target.value } )}
                      />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Device EUI (LoRaWAN)</label>
                    <input
                      className="h-9 rounded-lg border bg-background px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. wwwwwwwwwwwwwww"
                      value={draft.eui}
                      onChange={( e ) => setDraft( { ...draft, eui: e.target.value } )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Latitude</label>
                      <input
                        className="h-9 rounded-lg border bg-muted/50 px-3 font-mono text-xs"
                        value={draft.lat.toFixed( 5 )}
                        readOnly
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Longitude</label>
                      <input
                        className="h-9 rounded-lg border bg-muted/50 px-3 font-mono text-xs"
                        value={draft.lng.toFixed( 5 )}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/20 p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="armedCheck"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={draft.armed}
                        onChange={( e ) => setDraft( { ...draft, armed: e.target.checked } )}
                      />
                      <label htmlFor="armedCheck" className="text-xs font-semibold cursor-pointer">
                        Perimeter Armed
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Mode:</span>
                      <select
                        className="h-8 rounded-md border bg-background px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={draft.mode}
                        onChange={( e ) => setDraft( { ...draft, mode: e.target.value as "normal" | "maintenance" } )}
                      >
                        <option value="normal">Normal Operation</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">Click the map to select transformer coordinates:</p>
                  <div className="h-40 overflow-hidden rounded-xl border">
                    <Map
                      center={{ lat: draft.lat, lng: draft.lng }}
                      markers={markers}
                      onSelect={( lat, lng ) => setDraft( { ...draft, lat, lng } )}
                      className="h-40"
                    />
                  </div>

                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setOpen( false )}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddTransformer}
                      disabled={!draft.name.trim() || submitting}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {submitting ? "Saving..." : "Save Transformer"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b bg-muted/10">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, city, suburb, or EUI..."
              value={search}
              onChange={( e ) => setSearch( e.target.value )}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3.5">TRANSFORMER & TYPE</th>
                <th className="px-6 py-3.5">LOCATION</th>
                <th className="px-6 py-3.5">DEVICE EUI</th>
                <th className="px-6 py-3.5">ARMED</th>
                <th className="px-6 py-3.5">MODE</th>
                <th className="px-6 py-3.5">STATUS</th>
                <th className="px-6 py-3.5">LAST READING</th>
                <th className="px-6 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Loading transformers from Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    {transformers.length === 0
                      ? "No transformers registered yet in Firebase."
                      : "No transformers match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map( ( t ) => {
                  const isLive = t.name === LOCAL_TRANSFORMER_NAME || ( latestPacket && latestPacket.eui === t.eui );
                  const reading = rowLastReading( t );

                  return (
                    <tr
                      key={t.id}
                      className="group transition-colors hover:bg-muted/40 cursor-pointer"
                      onClick={() => navigate( `/transformers/${t.id}` )}
                    >
                      {/* Transformer Name & Type */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                            <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-sm leading-snug">
                                {t.name}
                              </p>
                              <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono font-bold text-muted-foreground">
                                {t.type || "GMT"}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              ID: {t.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location: City & Suburb */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs">
                          <p className="font-semibold text-foreground">{t.city || "Bulawayo"}</p>
                          <p className="text-[11px] text-muted-foreground">{t.suburb || "CBD"}</p>
                        </div>
                      </td>

                      {/* Device EUI */}
                      <td className="px-6 py-4 font-mono text-xs text-foreground/80 whitespace-nowrap">
                        <span className="rounded bg-muted/60 px-2 py-0.5 border border-border/50">
                          {t.eui || "—"}
                        </span>
                      </td>

                      {/* Armed Status Toggle Button */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={( e ) => handleToggleArmed( e, t.id, t.armed )}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors hover:opacity-85",
                            t.armed
                              ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 ring-red-500/30 dark:text-red-400"
                          )}
                          title="Click to toggle armed state"
                        >
                          {t.armed ? (
                            <>
                              <ShieldCheck className="h-3 w-3" />
                              Armed
                            </>
                          ) : (
                            <>
                              <ShieldOff className="h-3 w-3" />
                              Disarmed
                            </>
                          )}
                        </button>
                      </td>

                      {/* Mode Status Toggle Button */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={( e ) => handleToggleMode( e, t.id, t.mode )}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors hover:opacity-85",
                            t.mode === "maintenance"
                              ? "border-amber-300 bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-400"
                              : "bg-blue-500/10 text-blue-600 ring-blue-500/30 dark:text-blue-400"
                          )}
                          title="Click to toggle operational mode"
                        >
                          <Wrench className="h-3 w-3" />
                          {t.mode === "maintenance" ? "Maintenance" : "Normal"}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLive ? (
                          <StatusPill status={liveStatus} size="sm" />
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-offline" aria-hidden />
                            Awaiting data
                          </span>
                        )}
                      </td>

                      {/* Last Reading */}
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {reading ? formatRelativeTime( reading ) : "No data yet"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap" onClick={( e ) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => navigate( `/transformers/${t.id}` )}
                            title="View Dashboard"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                            onClick={( e ) => handleDeleteTransformer( e, t.id, t.name )}
                            title="Delete Transformer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                } )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
