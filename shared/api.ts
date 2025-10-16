/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export type Transformer = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

export type SensorScheme = {
  "key": string,
  "label": string,
  "unit"?: string,
  "icon": string,
  "kind": "number" | "boolean",
  "min"?: number,
  "max"?: number,
  "normal"?: [ number, number ],
  format?: ( v: number | boolean ) => string;
}

export type Sensor = {
  "name": string,
  "desc": string
}

export type SensorData = {
  cabinetHumidity: number;
  cabinetTemp: number;
  currentSensor: 0 | 1;
  doorSensor: 0 | 1;
  oilLevelSensor: 0 | 1;
  pirSensor: 0 | 1;
  transf_temperature: number;
  ts: number;
  vibrationSensor: 0 | 1;
  voltSensor: number;
}