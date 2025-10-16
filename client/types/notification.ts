export type AlertItem = {
    id: string;
    key: string;
    label: string;
    value: number | boolean;
    severity: "warn" | "crit";
    ts: number;
    transformerId?: string;
    transformerName?: string;
    lat?: number;
    lng?: number;
    message?: string;
};