import * as XLSX from "xlsx"

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

/**
 * Column descriptor for {@link exportNodes}. Generic in T so the same
 * exporter works for any row shape (BaseNode, BirthdayNode, …).
 */
export interface ExportColumn<T> {
  key: keyof T
  label: string
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function toCSV<T>(nodes: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((c) => c.label).join(",")
  const rows = nodes.map((node) =>
    columns.map((c) => {
      const raw = node[c.key] ?? ""
      const stringValue = Array.isArray(raw)
        ? raw.join(", ")
        : c.key === "taxId" ? formatCuit(String(raw)) : String(raw)
      return stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue
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

/**
 * Exports an array of rows to CSV or XLSX.
 * Generic in T so the same exporter works for any row shape — pass the
 * columns you want and they'll be projected in order.
 */
export function exportNodes<T>(
  nodes: T[],
  columns: ExportColumn<T>[],
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
    ...nodes.map((node) => columns.map((c) => {
      const raw = node[c.key] ?? ""
      if (Array.isArray(raw)) return raw.join(", ")
      if (c.key === "taxId") return formatCuit(String(raw))
      return raw
    })),
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Datos")
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer
  download(buf, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}