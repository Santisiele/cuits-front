import { useState } from "react";
import { endpoints } from "../config/endpoints";
import { getPath, getGraphByCuit } from "../services/graphService";
import { mapPathToGraph } from "../mappers/graphMapper";
import { EndpointSelector } from "../components/EndpointSelector";
import { QueryForm } from "../components/QueryForm";
import { GraphView } from "../components/GraphView";
import type { EndpointType } from "../types/api";

export default function Home() {
  const [selected, setSelected] = useState<EndpointType>("cuit");
  const [values, setValues] = useState<Record<string, string>>({});
  const [graph, setGraph] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = endpoints.find((e) => e.type === selected)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setGraph(null);

    try {
      setLoading(true);

      // 🔹 PATH
      if (selected === "path") {
        if (!values.from || !values.to) {
          setError("Completá ambos CUITs");
          return;
        }

        const data = await getPath(values.from, values.to);

        if (!data.path || data.path.length === 0) {
          setError("No se encontró relación");
          return;
        }

        const graphData = mapPathToGraph(data.path);
        setGraph(graphData);
      }

      // 🔹 CUIT
      if (selected === "cuit") {
        if (!values.taxId) {
          setError("Ingresá un CUIT");
          return;
        }

        const data = await getGraphByCuit(values.taxId);

        if (!data.found || data.results.length === 0) {
          setError("CUIT no encontrado");
          return;
        }

        const node = data.results[0];

        setGraph({
          nodes: [
            {
              id: data.cuit,
              label: node.data.businessName
            }
          ],
          edges: []
        });
      }
    } catch (err) {
      console.error(err);
      setError("Error al consultar la API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 20 }}>
      {/* 🔹 PANEL IZQUIERDO */}
      <div style={{ width: 300 }}>
        <h1>CUIT Explorer</h1>

        <EndpointSelector
          value={selected}
          onChange={(value) => {
            setSelected(value);
            setValues({});
            setGraph(null);
            setError(null);
          }}
          endpoints={endpoints}
        />

        <QueryForm
          endpoint={endpoint}
          values={values}
          onChange={(name, value) =>
            setValues((prev) => ({ ...prev, [name]: value }))
          }
          onSubmit={handleSubmit}
        />

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      {/* 🔹 PANEL DERECHO */}
      <div style={{ flex: 1 }}>
        {graph ? (
          <GraphView graph={graph} />
        ) : (
          <div
            style={{
              height: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999"
            }}
          >
            No hay datos
          </div>
        )}
      </div>
    </div>
  );
}