import { ref, query, limitToLast, onValue, get } from "firebase/database";
import { database } from "../lib/firebase.js";
import { useEffect, useState } from "react";
import { sensors, sensorSchema } from "@/lib/sensors";
import { useSensorHistoryStore } from "@/store/sensorStore";

export const useSensors = () => {
  const [sensorData, setSensorData] = useState(null);
  const [latestPacket, setLatestPacket] = useState(null);

  const { history, setHistory, addPacket } = useSensorHistoryStore();

  useEffect(() => {
    async function fetchHistoricalData() {
      const historyRef = ref(database, "loriotData");

      const snap = await get(historyRef);
      if (!snap.exists()) return;

      const packets = Object.values(snap.val());
      const sorted = packets.sort((a, b) => a.ts - b.ts);

      setHistory(sorted);
    }

    fetchHistoricalData();
  }, [setHistory]);

  useEffect(() => {
    const liveRef = query(ref(database, "loriotData"), limitToLast(1));

    const unsubscribe = onValue(liveRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const packet = Object.values(snapshot.val())[0];

      setLatestPacket(packet);
      setSensorData(packet?.decoded || null);

      // Avoid duplicates: add only if new timestamp
      const alreadyExists = history.some((p) => p.ts === packet.ts);
    
      if (!alreadyExists) {
        addPacket(packet);
      }

    });

    return () => unsubscribe();

  }, [addPacket, history]);

  return {
    sensors,
    sensorSchema,
    sensorData,
    latestPacket,
    history,
  };

};

export default useSensors;
