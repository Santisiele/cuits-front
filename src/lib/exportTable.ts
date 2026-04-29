import * as XLSX from "xlsx"
import type { BaseNode } from "@/types"

// ─── Formatters ──────────────────────────────────────────────────────────────

/**
 * Formats a raw CUIT string (11 digits) as XX-XXXXXXXX-X.
 * Returns the original value if it doesn't match the expected format.
 */
function formatCuit(taxId: string): string {
  const digits = taxId.replace(/\D/g, "")
  if (digits.length !== 11) return taxId
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function toCSV(nodes: BaseNode[], columns: { key: keyof BaseNode; label: string }[]): string {
  const header = columns.map((c) => c.label).join(",")
  const rows = nodes.map((node) =>
    columns.map((c) => {
      const raw = node[c.key] ?? ""
      const str = c.key === "taxId" ? formatCuit(String(raw)) : String(raw)
      return str.includes(",") || str.includes("\n") || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(",")
  )
  return [header, ...rows].join("\n")
}

// ─── Download helper ──────────────────────────────────────────────────────────

function download(content: string | ArrayBuffer, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function exportNodes(
  nodes: BaseNode[],
  columns: { key: keyof BaseNode; label: string }[],
  filename: string,
  format: "csv" | "xlsx"
): void {
  if (format === "csv") {
    download(toCSV(nodes, columns), `${filename}.csv`, "text/csv;charset=utf-8;")
    return
  }

  // XLSX via SheetJS
  const data = [
    columns.map((c) => c.label),
    ...nodes.map((node) => columns.map((c) => c.key === "taxId" ? formatCuit(String(node[c.key] ?? "")) : (node[c.key] ?? ""))),
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Datos")
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer
  download(buf, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}