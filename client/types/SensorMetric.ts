export type SensorMetric = {
    key: string;
    label: string;
    unit?: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    format?: ( v: number | boolean ) => string;
    kind: "number" | "boolean";
    min?: number;
    max?: number;
    normal?: [ number, number ];
};