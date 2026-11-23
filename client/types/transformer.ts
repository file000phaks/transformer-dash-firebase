export type Transformer = {
  id: string;
  name: string;
  city: string;
  suburb: string;
  eui: string;
  type: string;
  lat: number;
  lng: number;
  armed: boolean;
  mode: "normal" | "maintenance";
};
