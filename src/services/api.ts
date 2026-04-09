import type { CuitSearchResponse, PathResponse } from "../types"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

/**
 * Searches for a Tax ID in the graph database
 * @param taxId - Tax ID to search for
 * @param maxDepth - Maximum path depth (default: 3)
 */
export async function searchCuit(
  taxId: string,
  maxDepth = 3
): Promise<CuitSearchResponse> {
  const response = await fetch(
    `${API_URL}/graph/cuit/${taxId}?maxDepth=${maxDepth}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? "Failed to search for Tax ID")
  }

  return response.json()
}

/**
 * Finds the shortest path between two Tax IDs
 * @param from - Starting Tax ID
 * @param to - Target Tax ID
 * @param maxDepth - Maximum path depth (default: 3)
 */
export async function findPath(
  from: string,
  to: string,
  maxDepth = 3
): Promise<PathResponse> {
  const response = await fetch(
    `${API_URL}/graph/path?from=${from}&to=${to}&maxDepth=${maxDepth}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? "Failed to find path")
  }

  return response.json()
}

export async function addRelationship(
  fromTaxId: string,
  toTaxId: string,
  relationshipType: number
): Promise<void> {
  const response = await fetch(`${API_URL}/graph/relationship`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromTaxId, toTaxId, relationshipType }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? "Failed to add relationship")
  }
}

export async function deleteRelationship(
  fromTaxId: string,
  toTaxId: string,
  relationshipType: number
): Promise<void> {
  const response = await fetch(`${API_URL}/graph/relationship`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromTaxId, toTaxId, relationshipType }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? "Failed to delete relationship")
  }
}

export async function getNode(taxId: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_URL}/graph/node/${taxId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? "Failed to get node")
  }

  return response.json()
}

export async function updateNode(
  taxId: string,
  fields: { phone?: string; email?: string; birthday?: string }
): Promise<void> {
  const response = await fetch(`${API_URL}/graph/node/${taxId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? "Failed to update node")
  }
}

export async function getNodeRelationships(
  taxId: string,
  maxDepth = 3
): Promise<CuitSearchResponse> {
  const response = await fetch(
    `${API_URL}/graph/node/${taxId}/relationships?maxDepth=${maxDepth}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? "Failed to get relationships")
  }

  const data = await response.json()

  return {
    cuit: taxId,
    found: data.found,
    results: data.results,
  }
}

export interface BaseNode {
  taxId: string
  businessName: string
  source: string
  relationshipCount: number
}

export async function getMyBaseNodes(): Promise<BaseNode[]> {
  const response = await fetch(`${API_URL}/graph/nodes`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? "Failed to get nodes")
  }

  const data = await response.json()
  return data.nodes
}