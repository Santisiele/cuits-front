import type { EndpointConfig } from "../types/api";

type Props = {
  endpoint: EndpointConfig;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export const QueryForm = ({ endpoint, values, onChange, onSubmit }: Props) => {
  return (
    <form onSubmit={onSubmit}>
      {endpoint.fields.map((field) => (
        <input
          key={field.name}
          placeholder={field.label}
          value={values[field.name] || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      ))}

      <button type="submit">Buscar</button>
    </form>
  );
};