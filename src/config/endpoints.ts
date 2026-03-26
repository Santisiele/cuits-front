import type { EndpointConfig } from "../types/api";

export const endpoints: EndpointConfig[] = [
  {
    type: "cuit",
    label: "Buscar CUIT",
    fields: [{ name: "taxId", label: "CUIT" }]
  },
  {
    type: "path",
    label: "Buscar relación",
    fields: [
      { name: "from", label: "Desde CUIT" },
      { name: "to", label: "Hasta CUIT" }
    ]
  }
];