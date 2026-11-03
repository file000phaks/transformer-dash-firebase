import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Globe,
  Radio,
  Server,
  CheckCircle2,
  Shield,
  Filter,
  Plus,
  Search,
  Eye,
  Trash2,
  ListFilter,
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

const LOCAL_TRANSFORMER_NAME = "Local";
const DEFAULT_DRAFT_COORDS = { lat: -20.1626, lng: 28.6417 };

export default function TransformersPage() {
  const { transformers, loading, addTransformer, deleteTransformer } = useTransformers();
  const { sensorData, latestPacket } = useSensors();

  const lastSynced = latestPacket?.ts as number | undefined;
  const liveStatus = computePacketStatus(sensorData, lastSynced);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState({ name: "", ...DEFAULT_DRAFT_COORDS });

  const navigate = useNavigate();

  const markers: MapMarker[] = useMemo(
    () => [{ id: "draft", lat: draft.lat, lng: draft.lng, label: draft.name || "New transformer" }],
    [draft]
  );

  const filtered = useMemo(
    () =>
      transformers.filter((t) =>
        (t.name || "").toLowerCase().includes(search.trim().toLowerCase())
      ),
    [transformers, search]
  );

  const liveCount = transformers.filter((t) => t.name === LOCAL_TRANSFORMER_NAME).length;
  const awaitingCount = Math.max(0, transformers.length - liveCount);

  function rowLastReading(name: string) {
    return name === LOCAL_TRANSFORMER_NAME ? lastSynced : undefined;
  }

  async function handleAddTransformer() {
    if (!draft.name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addTransformer({
        name: draft.name.trim(),
        lat: draft.lat,
        lng: draft.lng,
      });
      setDraft({ name: "", ...DEFAULT_DRAFT_COORDS });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTransformer(id: string, name: string) {
    if (window.confirm(`Delete transformer "${name}"?`)) {
      await deleteTransformer(id);
    }
  }

  const coveragePercent = transformers.length > 0
    ? Math.round((filtered.length / transformers.length) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      {/* 1. TOP STAT CARDS ROW (4 Cards matching the design template) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active Workspace Layer */}
        <div className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Transformers</h2>
            <p className="mt-1 text-xs text-muted-foreground">Active workspace layer</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Radio className="h-4 w-4" />
          </div>
        </div>

        {/* Card 2: Records in Scope */}
        <div className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? "..." : transformers.length}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {transformers.length} records in scope
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Globe className="h-4 w-4" />
          </div>
        </div>

        {/* Card 3: Live Streaming Units */}
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

        {/* Card 4: Awaiting Data Units */}
        <div className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? "..." : awaitingCount}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {awaitingCount} awaiting connection
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION (Hierarchy / Scope Summary + Workspace State) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Card: FLEET OVERVIEW */}
        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                FLEET OVERVIEW
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Shield className="h-3.5 w-3.5" />
              </div>
            </div>
            <h3 className="mt-1 text-base font-semibold text-foreground">
              Registry overview
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground">Registered</p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{transformers.length}</p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground">Live Unit</p>
                <p className="mt-0.5 text-sm font-bold text-foreground">
                  {liveCount > 0 ? "Local" : "None"}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground">Awaiting</p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{awaitingCount}</p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground">Provider</p>
                <p className="mt-0.5 truncate text-sm font-bold text-foreground">Firebase</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              TELEMETRY INGESTION
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              Realtime Database (loriotData)
            </p>
          </div>
        </div>

        {/* Right Card: WORKSPACE STATE */}
        <div className="rounded-2xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                WORKSPACE STATE
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/60">
                <Filter className="h-3.5 w-3.5" />
              </div>
            </div>
            <h3 className="mt-1 text-base font-semibold text-foreground">
              Access and filter overview
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Live stream</p>
                <div className="mt-0.5">
                  <StatusPill status={liveStatus} size="sm" />
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Last reading</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-foreground font-mono">
                  {lastSynced ? formatRelativeTime(lastSynced) : "No data yet"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Filter</p>
                <p className="mt-0.5 text-sm font-bold text-foreground">
                  {search ? "Active" : "None"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Scope</p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{transformers.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Visible records</span>
              <span className="font-bold text-foreground">
                {filtered.length} of {transformers.length}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: TRANSFORMERS TABLE */}
      <div className="rounded-2xl border bg-card shadow-xs">
        {/* Table Header Section */}
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              TRANSFORMERS TABLE
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-foreground">
              Registered Transformers
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Review status, coordinates, and telemetry stream access without leaving the current hierarchy context.
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

              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Add Transformer</DialogTitle>
                </DialogHeader>

                <div className="mt-3 grid gap-3.5">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Name</label>
                    <input
                      className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Substation Unit 2"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Latitude</label>
                      <input
                        className="h-10 rounded-lg border bg-muted/50 px-3 font-mono text-sm"
                        value={draft.lat}
                        readOnly
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Longitude</label>
                      <input
                        className="h-10 rounded-lg border bg-muted/50 px-3 font-mono text-sm"
                        value={draft.lng}
                        readOnly
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">Click the map to select coordinates.</p>
                  <div className="h-44 overflow-hidden rounded-xl border">
                    <Map
                      center={{ lat: draft.lat, lng: draft.lng }}
                      markers={markers}
                      onSelect={(lat, lng) => setDraft({ ...draft, lat, lng })}
                      className="h-44"
                    />
                  </div>

                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
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
              placeholder="Search transformers by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3.5">TRANSFORMER</th>
                <th className="px-6 py-3.5">COORDINATES</th>
                <th className="px-6 py-3.5">STATUS</th>
                <th className="px-6 py-3.5">LAST READING</th>
                <th className="px-6 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Loading transformers from Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    {transformers.length === 0
                      ? "No transformers registered yet in Firebase."
                      : "No transformers match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isLive = t.name === LOCAL_TRANSFORMER_NAME;
                  const reading = rowLastReading(t.name);

                  return (
                    <tr
                      key={t.id}
                      className="group transition-colors hover:bg-muted/40 cursor-pointer"
                      onClick={() => navigate(`/transformers/${t.id}`)}
                    >
                      {/* Transformer Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                            <Zap className="h-5 w-5 fill-amber-500 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm leading-snug">
                              {t.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              ID: {t.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Coordinates */}
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {t.lat.toFixed(5)}, {t.lng.toFixed(5)}
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
                        {reading ? formatRelativeTime(reading) : "No data yet"}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-6 py-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/transformers/${t.id}`)}
                            className="h-8 gap-1 px-2.5 text-xs hover:bg-muted font-medium"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTransformer(t.id, t.name)}
                            className="h-8 gap-1 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
