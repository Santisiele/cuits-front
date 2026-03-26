const API_URL = import.meta.env.VITE_API_URL;

export const getPath = async (from: string, to: string) => {
  const res = await fetch(
    `${API_URL}/graph/path?from=${from}&to=${to}`
  );

  if (!res.ok) {
    throw new Error("Error fetching path");
  }

  return res.json();
};

export const getGraphByCuit = async (taxId: string) => {
  const res = await fetch(
    `${API_URL}/graph/cuit/${taxId}`
  );

  if (!res.ok) {
    throw new Error("Error fetching cuit");
  }

  return res.json();
};