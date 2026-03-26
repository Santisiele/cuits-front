import type { EndpointConfig, EndpointType } from "../types/api";

type Props = {
  value: EndpointType;
  onChange: (value: EndpointType) => void;
  endpoints: EndpointConfig[];
};

export const EndpointSelector = ({ value, onChange, endpoints }: Props) => {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as EndpointType)}>
      {endpoints.map((ep) => (
        <option key={ep.type} value={ep.type}>
          {ep.label}
        </option>
      ))}
    </select>
  );
};