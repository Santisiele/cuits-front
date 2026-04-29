import * as XLSX from "xlsx"
import type { BaseNode } from "@/types"

// ─── CSV export ───────────────────────────────────────────────────────────────

function toCSV(nodes: BaseNode[], columns: { key: keyof BaseNode; label: string }[]): string {
  const header = columns.map((c) => c.label).join(",")
  const rows = nodes.map((node) =>
    columns.map((c) => {
      const val = node[c.key] ?? ""
      const str = String(val)
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
  const data = [
    columns.map((c) => c.label),
    ...nodes.map((node) => columns.map((c) => node[c.key] ?? "")),
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Datos")
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer
  download(buf, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}
