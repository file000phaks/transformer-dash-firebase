import { create } from "zustand";

export const useSensorHistoryStore = create((set) => ({
    history: [],

    setHistory: (data) =>
        set(() => ({
            history: data
        })),

    addPacket: (packet) =>
        set((state) => ({
            history: [...state.history, packet]
        })),
        
}));
