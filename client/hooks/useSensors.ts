import { ref, query, orderByChild, limitToLast, get, onValue } from "firebase/database";
import { database } from "../lib/firebase.js";
import { useEffect, useMemo, useState } from "react";
import { sensors, sensorSchema, localToFirebaseMap } from "@/lib/sensors";
import { useSensorHistoryStore } from "@/store/sensorStore";

// Genuine live subscription against Firebase RTDB — no polling, no artificial
// delay, no client-side timestamp substitution. `onValue` on a `limitToLast(1)`
// query fires immediately with whatever the current latest record is, then
// again every time a new record is actually written to `loriotData`. This
// replaces the earlier record-by-record cycling/replay of historical data
// entirely (see "Live Stream Implementation" in Questions.md for that
// approach's history) and the timestamp-shift approach before that.
const BUFFER_SIZE = 100;

// Firebase RTDB snapshot values come back typed as `unknown`; this describes the one
// real shape confirmed in Questions.md ("Firebase Data Inspection") for `loriotData`.
// Every field inside `decoded` is optional in practice (~1-2% of real records are
// missing one or more fields — see "Firebase Schema Hardening" in Questions.md).
type SensorPacket = { ts: number; decoded?: Record<string, number | boolean> };

/** The 9 live-metric Firebase field names, derived from the same schema map lib/sensors.ts
 * already uses everywhere else, so this list can't drift out of sync with it. */
const METRIC_FB_KEYS = Object.values(localToFirebaseMap);

export type LastKnownEntry = { value: number | boolean; updatedAt: number; updatedAtTick: number };
export type LastKnownGood = Partial<Record<string, LastKnownEntry>>;

export const useSensors = () => {
  const [sensorData, setSensorData] = useState<Record<string, number | boolean> | null>(null);
  const [latestPacket, setLatestPacket] = useState<SensorPacket | null>(null);

  // Per-metric "last known good" value, kept separate from the raw current record.
  // A field only updates here when a newly emitted record actually contains it —
  // when a record is missing a field, its entry here is left untouched rather than
  // cleared, so the UI keeps showing the last real reading instead of blanking out
  // on routine missing-field records (see "Last-Known-Good Value Handling" in
  // Questions.md). This logic is unchanged by the switch to real streaming — it
  // still just reacts to whatever record arrives next, live or otherwise.
  const [lastKnownGood, setLastKnownGood] = useState<LastKnownGood>({});

  // Diagnostics for the on-page debug panel (client/components/site/DebugPanel.tsx).
  // `totalRecords` is how many records the initial buffer seed loaded; `tickCount`
  // counts real live updates received (not simulated ticks); `lastTickAt` is the
  // real `ts` of the most recent live write.
  const [totalRecords, setTotalRecords] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);

  const { history, setHistory } = useSensorHistoryStore();

  useEffect(() => {
    let cancelled = false;

    // Keyed by each record's real Firebase push id (not array index), so the
    // one-time 100-record buffer seed and the ongoing live listener can both
    // write into the same map without racing each other into duplicate entries
    // — whichever resolves first just seeds the key, whichever resolves second
    // is a no-op overwrite of the same value.
    let bufferMap = new Map<string, SensorPacket>();
    let lastKnown: LastKnownGood = {};
    let tick = 0;

    function commitBuffer() {
      const sortedEntries = [...bufferMap.entries()].sort((a, b) => a[1].ts - b[1].ts);
      if (sortedEntries.length > BUFFER_SIZE) {
        bufferMap = new Map(sortedEntries.slice(-BUFFER_SIZE));
      }
      setHistory([...bufferMap.values()].sort((a, b) => a.ts - b.ts));
    }

    function applyRecords(entries: [string, SensorPacket][]) {
      for (const [key, record] of entries) bufferMap.set(key, record);
      commitBuffer();
    }

    // Each record's own real `ts` is used as-is from here on — no Date.now()
    // substitution, no timestamp shifting. Since this is a genuine live read,
    // the timestamp is already accurate.
    function applyLatest(record: SensorPacket) {
      tick += 1;

      const decoded = record.decoded ?? {};
      const nextLastKnown: LastKnownGood = { ...lastKnown };
      for (const key of METRIC_FB_KEYS) {
        const value = decoded[key];
        if (value !== undefined) {
          nextLastKnown[key] = { value, updatedAt: record.ts, updatedAtTick: tick };
        }
      }
      lastKnown = nextLastKnown;

      setLatestPacket(record);
      setSensorData(record.decoded ?? null);
      setLastKnownGood(lastKnown);
      setTickCount(tick);
      setLastTickAt(record.ts);
    }

    // One-time seed of the rolling buffer (chart history) from the last 100
    // records — populated once on load, not replayed record-by-record.
    const bufferQuery = query(ref(database, "loriotData"), orderByChild("ts"), limitToLast(BUFFER_SIZE));
    get(bufferQuery).then((snap) => {
      if (cancelled || !snap.exists()) return;
      const entries = Object.entries(snap.val()) as [string, SensorPacket][];
      setTotalRecords(entries.length);
      applyRecords(entries);
    });

    // Genuine live subscription: fires immediately with the current latest
    // record, then again every time a new one is actually written.
    const liveQuery = query(ref(database, "loriotData"), orderByChild("ts"), limitToLast(1));
    const unsubscribe = onValue(liveQuery, (snap) => {
      if (cancelled || !snap.exists()) return;
      const entries = Object.entries(snap.val()) as [string, SensorPacket][];
      applyRecords(entries);
      const [, record] = entries[0];
      applyLatest(record);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setHistory]);

  // Flattened { fieldKey: value } view of lastKnownGood — this is what stat tiles,
  // the health score, and the PDF report's current-score line read from, instead of
  // the raw current record directly. A field only appears here once it has had a
  // value at least once; until then it's genuinely absent (see requirement #6).
  const effectiveSensorData = useMemo(() => {
    const out: Record<string, number | boolean> = {};
    for (const key of Object.keys(lastKnownGood)) {
      const entry = lastKnownGood[key];
      if (entry) out[key] = entry.value;
    }
    return out;
  }, [lastKnownGood]);

  return {
    sensors,
    sensorSchema,
    sensorData,
    effectiveSensorData,
    lastKnownGood,
    latestPacket,
    history,
    totalRecords,
    tickCount,
    lastTickAt,
  };

};

export default useSensors;
