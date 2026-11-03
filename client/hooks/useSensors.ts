import { ref, query, orderByChild, limitToLast, get, onValue } from "firebase/database";
import { database } from "../lib/firebase.js";
import { useEffect, useMemo, useState } from "react";
import { sensors, sensorSchema, localToFirebaseMap } from "@/lib/sensors";
import { useSensorHistoryStore } from "@/store/sensorStore";
import { decodeUC100 } from "@/lib/decoder";

const BUFFER_SIZE = 100;

type SensorPacket = { 
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

export const useSensors = () => {
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

    function commitBuffer() {
      const sortedEntries = [...bufferMap.entries()].sort((a, b) => a[1].ts - b[1].ts);
      if (sortedEntries.length > BUFFER_SIZE) {
        bufferMap = new Map(sortedEntries.slice(-BUFFER_SIZE));
      }
      setHistory([...bufferMap.values()].sort((a, b) => a.ts - b.ts));
    }

    function applyRecords(entries: [string, SensorPacket][]) {
      for (const [key, record] of entries) {
        const decoded = extractDecoded(record);
        bufferMap.set(key, { ...record, decoded });
      }
      commitBuffer();
    }

    function applyLatest(record: SensorPacket) {
      tick += 1;

      const decoded = extractDecoded(record);
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
    const bufferQuery = query(ref(database, "loriotData"), orderByChild("ts"), limitToLast(BUFFER_SIZE));
    get(bufferQuery).then((snap) => {
      if (cancelled || !snap.exists()) return;
      const entries = Object.entries(snap.val()) as [string, SensorPacket][];
      setTotalRecords(entries.length);
      applyRecords(entries);
      const sorted = entries.slice().sort((a, b) => a[1].ts - b[1].ts);
      for (const [, record] of sorted) {
        applyLatest(record);
      }
    });

    // Genuine live subscription
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
