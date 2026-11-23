import { ref, query, orderByChild, limitToLast, get, onValue } from "firebase/database";
import { database } from "../lib/firebase.js";
import { useEffect, useMemo, useState } from "react";
import { sensors, sensorSchema, localToFirebaseMap } from "@/lib/sensors";
import { useSensorHistoryStore } from "@/store/sensorStore";
import { decodeUC100 } from "@/lib/decoder";

const BUFFER_SIZE = 100;

export type SensorPacket = { 
  ts: number; 
  decoded?: Record<string, number | boolean>;
  data?: string;
  payload?: string;
  payload_hex?: string;
  eui?: string;
  rssi?: number;
  snr?: number;
  freq?: number;
};

const METRIC_FB_KEYS = Object.values(localToFirebaseMap);

export type LastKnownEntry = { value: number | boolean; updatedAt: number; updatedAtTick: number };
export type LastKnownGood = Partial<Record<string, LastKnownEntry>>;

export const useSensors = ( targetEui?: string ) => {
  const [sensorData, setSensorData] = useState<Record<string, number | boolean> | null>(null);
  const [latestPacket, setLatestPacket] = useState<SensorPacket | null>(null);
  const [lastKnownGood, setLastKnownGood] = useState<LastKnownGood>({});

  const [totalRecords, setTotalRecords] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);

  const { history, setHistory } = useSensorHistoryStore();

  useEffect(() => {
    let cancelled = false;
    let bufferMap = new Map<string, SensorPacket>();
    let lastKnown: LastKnownGood = {};
    let tick = 0;

    function extractDecoded(record: any): Record<string, number | boolean> {
      let result: Record<string, any> = {};

      // If the packet has a raw hex payload string, decode it using decodeUC100
      const hexCandidate = 
        typeof record?.data === "string" ? record.data :
        typeof record?.payload === "string" ? record.payload :
        typeof record?.payload_hex === "string" ? record.payload_hex :
        typeof record?.decoded === "string" ? record.decoded :
        typeof record === "string" ? record : null;

      if (hexCandidate && hexCandidate.length >= 6) {
        try {
          const decodedFromHex = decodeUC100(hexCandidate);
          for (const [k, v] of Object.entries(decodedFromHex)) {
            if (v !== null) result[k] = v;
          }
        } catch (e) {
          console.warn("Failed to decode UC100 hex string:", e);
        }
      }

      // If record.decoded is already an object, merge it
      if (record?.decoded && typeof record.decoded === "object") {
        result = { ...result, ...record.decoded };
      }

      return result;
    }

    function extractPacketMeta(record: any): Partial<SensorPacket> {
      const eui = record?.eui || record?.decoded?.eui || undefined;
      const freq = typeof record?.freq === "number" ? record.freq : (typeof record?.decoded?.freq === "number" ? record.decoded.freq : undefined);
      const rssi = typeof record?.rssi === "number" ? record.rssi : (typeof record?.decoded?.rssi === "number" ? record.decoded.rssi : undefined);
      const snr = typeof record?.snr === "number" ? record.snr : (typeof record?.decoded?.snr === "number" ? record.decoded.snr : undefined);

      return { eui, freq, rssi, snr };
    }

    function matchesTarget(record: any): boolean {
      if (!targetEui) return true;
      const pEui = record?.eui || record?.decoded?.eui;
      if (pEui) {
        return String(pEui).trim().toLowerCase() === targetEui.trim().toLowerCase();
      }
      // If packet has no eui (legacy test records in loriotData), associate with default Local unit
      const normalized = targetEui.trim().toLowerCase();
      return normalized === "local" || normalized === "24e124621f404022" || normalized === "wwwwwwwwwwwwwww";
    }

    function commitBuffer() {
      const sortedEntries = [...bufferMap.entries()].sort((a, b) => a[1].ts - b[1].ts);
      if (sortedEntries.length > BUFFER_SIZE) {
        bufferMap = new Map(sortedEntries.slice(-BUFFER_SIZE));
      }
      setHistory([...bufferMap.values()].sort((a, b) => a.ts - b.ts));
    }

    function applyRecords(entries: [string, any][]) {
      for (const [key, rawRecord] of entries) {
        if (!matchesTarget(rawRecord)) continue;
        const decoded = extractDecoded(rawRecord);
        const meta = extractPacketMeta(rawRecord);
        bufferMap.set(key, { ...rawRecord, ...meta, decoded });
      }
      commitBuffer();
    }

    function applyLatest(rawRecord: any) {
      if (!matchesTarget(rawRecord)) return;
      tick += 1;

      const decoded = extractDecoded(rawRecord);
      const meta = extractPacketMeta(rawRecord);
      const record: SensorPacket = { ...rawRecord, ...meta, decoded };

      const nextLastKnown: LastKnownGood = { ...lastKnown };
      for (const key of METRIC_FB_KEYS) {
        // Also support pirSensor2 which newer hardware/decoder firmware writes
        const value = decoded[key] !== undefined 
          ? decoded[key] 
          : (key === "pirSensor" ? decoded["pirSensor2"] : undefined);

        if (value !== undefined) {
          nextLastKnown[key] = { value, updatedAt: record.ts, updatedAtTick: tick };
        }
      }
      lastKnown = nextLastKnown;

      setLatestPacket(record);
      setSensorData(decoded);
      setLastKnownGood(lastKnown);
      setTickCount(tick);
      setLastTickAt(record.ts);
    }

    // One-time seed of the rolling buffer (chart history) from the last 100 records
    const bufferQuery = query(ref(database, "loriotData"), orderByChild("ts"), limitToLast(BUFFER_SIZE * 2));
    get(bufferQuery).then((snap) => {
      if (cancelled || !snap.exists()) return;
      const entries = Object.entries(snap.val()) as [string, any][];
      const matched = entries.filter(([, r]) => matchesTarget(r));
      setTotalRecords(matched.length);
      applyRecords(entries);
      const sorted = matched.slice().sort((a, b) => a[1].ts - b[1].ts);
      for (const [, record] of sorted) {
        applyLatest(record);
      }
    });

    // Genuine live subscription
    const liveQuery = query(ref(database, "loriotData"), orderByChild("ts"), limitToLast(5));
    const unsubscribe = onValue(liveQuery, (snap) => {
      if (cancelled || !snap.exists()) return;
      const entries = Object.entries(snap.val()) as [string, any][];
      applyRecords(entries);
      const sorted = entries.slice().sort((a, b) => a[1].ts - b[1].ts);
      const latestMatching = sorted.reverse().find(([, r]) => matchesTarget(r));
      if (latestMatching) {
        applyLatest(latestMatching[1]);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setHistory, targetEui]);

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
