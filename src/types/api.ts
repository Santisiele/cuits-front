
// types/api.ts
export type EndpointType = "cuit" | "path";

export interface EndpointConfig {
  type: EndpointType;
  label: string;
  fields: { name: string; label: string }[];
}